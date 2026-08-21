"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";
import Papa from "papaparse";
import { FaDownload, FaSearch, FaFilter, FaEye, FaEyeSlash, FaEdit, FaTrash, FaUpload, FaPlus, FaHistory, FaCheckCircle, FaMapMarkedAlt } from "react-icons/fa";
import { MdClose } from "react-icons/md";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

// Builds a compact page-number list: always the first and last page, the
// current page and one neighbour on each side, with "…" filling any gap —
// e.g. [1, "…", 11, 12, 13, "…", 104] instead of every page from 1 to 104.
function getPaginationItems(current, total) {
  const items = [];
  const addPage = (p) => items.push(p);
  const addEllipsis = () => {
    if (items[items.length - 1] !== "…") items.push("…");
  };

  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - 1 && p <= current + 1)) {
      addPage(p);
    } else {
      addEllipsis();
    }
  }
  return items;
}

const CSV_TEMPLATE_HEADERS = [
  "storename",
  "businessNumber",
  "address",
  "city",
  "state",
  "zipcode",
  "country",
  "latitude",
  "longitude",
];

const TABS = [
  { key: "stores", label: "Stores" },
  { key: "users", label: "Users" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "products-desc", label: "Most Products" },
  { value: "products-asc", label: "Least Products" },
];

const StoresUsersPage = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stores");

  // Filter states
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterVerification, setFilterVerification] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Delete flow state
  const [deleteTarget, setDeleteTarget] = useState(null); // the user pending deletion
  const [deleting, setDeleting] = useState(false);

  // Bulk-select state — scoped per tab, since Stores and Users are separate
  // lists; switching tabs clears it so a selection made on one can't be
  // accidentally applied to the other.
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);

  // Quick-verify flow state
  const [verifyingId, setVerifyingId] = useState(null);

  // CSV bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState(null);

  // "Locate Pending Stores" — works through the backlog of verified stores
  // that have an address but no coordinates yet, one small rate-limited
  // batch at a time, looping automatically until it's cleared.
  const [showGeocode, setShowGeocode] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeStats, setGeocodeStats] = useState({ processed: 0, resolved: 0, failed: 0, totalPending: null });
  const [geocodeError, setGeocodeError] = useState(null);
  const geocodeStopRef = useRef(false);

  // Cooldown between runs — a full pass can already send a lot of requests
  // to the free geocoding service; this keeps someone from immediately
  // re-hammering it with another full pass right after one finishes.
  // Persisted so it survives closing the modal or reloading the page.
  const GEOCODE_COOLDOWN_MS = 15 * 60 * 1000;
  const [geocodeReadyAt, setGeocodeReadyAt] = useState(0);
  const [geocodeNow, setGeocodeNow] = useState(() => Date.now());

  useEffect(() => {
    const stored = Number(localStorage.getItem("geocodeReadyAt") || 0);
    if (stored) setGeocodeReadyAt(stored);
  }, []);

  useEffect(() => {
    if (!showGeocode) return;
    const interval = setInterval(() => setGeocodeNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [showGeocode]);

  const geocodeSecondsLeft = Math.max(0, Math.ceil((geocodeReadyAt - geocodeNow) / 1000));
  const geocodeOnCooldown = geocodeSecondsLeft > 0;

  const runGeocodePending = async () => {
    setGeocoding(true);
    setGeocodeError(null);
    setGeocodeStats({ processed: 0, resolved: 0, failed: 0, totalPending: null });
    geocodeStopRef.current = false;

    let afterId = null;
    try {
      while (!geocodeStopRef.current) {
        const res = await fetch("/api/admin/stores/geocode-pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ afterId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to locate stores");

        setGeocodeStats((prev) => ({
          processed: prev.processed + data.processed,
          resolved: prev.resolved + data.resolved,
          failed: prev.failed + data.failed,
          totalPending: data.totalPending,
        }));

        afterId = data.lastId;
        if (data.done) break;
      }
      if (!geocodeStopRef.current) {
        toast.success("Finished locating pending stores");
      }
      fetchUsers();
    } catch (err) {
      setGeocodeError(err.message || "Something went wrong");
    } finally {
      setGeocoding(false);
      const readyAt = Date.now() + GEOCODE_COOLDOWN_MS;
      localStorage.setItem("geocodeReadyAt", String(readyAt));
      setGeocodeReadyAt(readyAt);
      setGeocodeNow(Date.now());
    }
  };

  const stopGeocodePending = () => {
    geocodeStopRef.current = true;
  };

  // Add single store state — the real store sign-up form's fields, plus
  // address/location and a photo, which the sign-up form doesn't collect
  // but a store added one at a time in admin needs up front to actually
  // show up on the map/search page without a separate edit step after.
  const emptyAddStoreForm = {
    firstname: "",
    lastname: "",
    storename: "",
    country: "",
    businessNumber: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    latitude: "",
    longitude: "",
    logoUrl: "",
    logoPublicId: "",
    isVerified: true,
  };

  const COUNTRY_OPTIONS = [
    { value: "DK", label: "Denmark (DK)" },
    { value: "FR", label: "France (FR)" },
    { value: "DE", label: "Germany (DE)" },
    { value: "IT", label: "Italy (IT)" },
    { value: "ES", label: "Spain (ES)" },
    { value: "NL", label: "Netherlands (NL)" },
    { value: "SE", label: "Sweden (SE)" },
    { value: "NO", label: "Norway (NO)" },
  ];
  const [showAddStore, setShowAddStore] = useState(false);
  const [addStoreForm, setAddStoreForm] = useState(emptyAddStoreForm);
  const [addingStore, setAddingStore] = useState(false);
  const [addStoreError, setAddStoreError] = useState(null);
  const [showAddStorePassword, setShowAddStorePassword] = useState(false);
  const [uploadingStorePhoto, setUploadingStorePhoto] = useState(false);

  // Same /api/upload Cloudinary flow the store's own dashboard Branding tab
  // uses — just triggered from admin instead, since an admin-added store
  // (especially an Unclaimed one) has no owner who can log in and set it.
  const handleStorePhotoUpload = async (e, formSetter) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingStorePhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("isProfileImage", false);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      formSetter((f) => ({ ...f, logoUrl: data.url, logoPublicId: data.publicId }));
      toast.success("Photo uploaded!");
    } catch (err) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploadingStorePhoto(false);
    }
  };

  const handleAddStore = async () => {
    setAddingStore(true);
    setAddStoreError(null);
    try {
      const res = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addStoreForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add store");
      toast.success(`"${addStoreForm.storename}" added`);
      setShowAddStore(false);
      setAddStoreForm(emptyAddStoreForm);
      fetchUsers();
    } catch (err) {
      setAddStoreError(err.message);
      toast.error(err.message);
    } finally {
      setAddingStore(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Derive unique countries & cities for filter dropdowns
  const countries = useMemo(() => {
    const set = new Set(allUsers.map((u) => u.country).filter(Boolean));
    return [...set].sort();
  }, [allUsers]);

  const cities = useMemo(() => {
    let filtered = allUsers;
    if (filterCountry) {
      filtered = filtered.filter((u) => u.country === filterCountry);
    }
    const set = new Set(filtered.map((u) => u.city).filter(Boolean));
    return [...set].sort();
  }, [allUsers, filterCountry]);

  // Get the joined date from createdAt or fallback to ObjectId
  const getJoinedDate = (user) => {
    if (user.createdAt) return new Date(user.createdAt);
    if (user._id) {
      return new Date(parseInt(user._id.substring(0, 8), 16) * 1000);
    }
    return null;
  };

  // Filter + sort logic
  const filteredUsers = useMemo(() => {
    let list = allUsers;

    // Tab filter
    if (activeTab === "stores") {
      list = list.filter((u) => u.role === "store");
    } else {
      list = list.filter((u) => u.role !== "store");
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          `${u.firstname} ${u.lastname}`.toLowerCase().includes(q) ||
          (u.storename && u.storename.toLowerCase().includes(q)) ||
          (u.brandname && u.brandname.toLowerCase().includes(q)) ||
          u.email.toLowerCase().includes(q),
      );
    }

    // Country filter
    if (filterCountry) {
      list = list.filter((u) => u.country === filterCountry);
    }

    // City filter
    if (filterCity) {
      list = list.filter((u) => u.city === filterCity);
    }

    // Verification filter (stores only — isVerified is false for CSV/unclaimed stores)
    if (filterVerification === "unverified") {
      list = list.filter((u) => u.isVerified === false);
    } else if (filterVerification === "verified") {
      list = list.filter((u) => u.isVerified !== false);
    }

    // Location filter — stores with no lat/long don't show as map pins in Discover
    if (filterLocation === "missing") {
      list = list.filter(
        (u) => u.latitude == null || u.longitude == null
      );
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((u) => {
        const d = getJoinedDate(u);
        return d && d >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((u) => {
        const d = getJoinedDate(u);
        return d && d <= to;
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return `${a.firstname} ${a.lastname}`.localeCompare(
            `${b.firstname} ${b.lastname}`,
          );
        case "name-desc":
          return `${b.firstname} ${b.lastname}`.localeCompare(
            `${a.firstname} ${a.lastname}`,
          );
        case "newest": {
          const da = getJoinedDate(a);
          const db = getJoinedDate(b);
          return (db?.getTime() || 0) - (da?.getTime() || 0);
        }
        case "oldest": {
          const da = getJoinedDate(a);
          const db = getJoinedDate(b);
          return (da?.getTime() || 0) - (db?.getTime() || 0);
        }
        case "products-desc":
          return (b.productCount || 0) - (a.productCount || 0);
        case "products-asc":
          return (a.productCount || 0) - (b.productCount || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [
    allUsers,
    activeTab,
    search,
    sortBy,
    filterCountry,
    filterCity,
    filterVerification,
    filterLocation,
    dateFrom,
    dateTo,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, sortBy, filterCountry, filterCity, filterVerification, filterLocation, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  // CSV download
  const downloadCSV = () => {
    const headers = [
      "Name",
      "Role",
      "Email",
      "Phone",
      "Country",
      "City",
      ...(activeTab === "stores" ? ["CVR Number"] : []),
      "Products",
      "Status",
      "Joined",
    ];

    const rows = filteredUsers.map((u) => {
      const joined = getJoinedDate(u);
      return [
        `${u.firstname} ${u.lastname}`,
        u.role,
        u.email,
        u.phone || "",
        u.country || "",
        u.city || "",
        ...(activeTab === "stores" ? [u.businessNumber || ""] : []),
        u.productCount || 0,
        u.isActive === true
          ? "Active"
          : u.isActive === false
            ? "Inactive"
            : "-",
        joined ? joined.toLocaleDateString() : "-",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsvTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_HEADERS.join(",") + "\n"], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "store-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkError(null);
    setBulkResult(null);
    setBulkUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        try {
          if (!parsed.data.length) {
            setBulkError("The CSV file has no rows.");
            return;
          }
          const res = await fetch("/api/admin/stores/bulk-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: parsed.data }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Import failed");
          setBulkResult(json);
          fetchUsers();
        } catch (err) {
          setBulkError(err.message);
        } finally {
          setBulkUploading(false);
        }
      },
      error: (err) => {
        setBulkError(err.message);
        setBulkUploading(false);
      },
    });
    // Allow re-selecting the same file again later
    e.target.value = "";
  };

  const clearFilters = () => {
    setSearch("");
    setSortBy("newest");
    setFilterCountry("");
    setFilterCity("");
    setFilterVerification("");
    setFilterLocation("");
    setDateFrom("");
    setDateTo("");
  };

  // One-click verify straight from the table — same PATCH the store-details
  // edit page's "Verified" checkbox uses, just without leaving the list.
  const handleQuickVerify = async (user) => {
    setVerifyingId(user._id);
    try {
      const res = await fetch(`/api/admin/store-details/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify store");

      setAllUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isVerified: true } : u)),
      );
      toast.success(`"${user.storename || user.firstname}" marked as verified`);
    } catch (err) {
      toast.error(err.message || "Something went wrong while verifying.");
    } finally {
      setVerifyingId(null);
    }
  };

  // Hard-deletes the user + all their associated data — the server backs up
  // a full snapshot first (see /admin/stores-users/deleted), so this can be
  // undone from there if it turns out to be a mistake.
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete user.");
        return;
      }

      // Remove from the in-memory list so the table updates immediately.
      setAllUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      toast.success(data.message || "User deleted.");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete request failed:", err);
      toast.error("Something went wrong while deleting.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    const pageIds = paginatedUsers.map((u) => u._id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Reuses the same single DELETE endpoint (backup + cascade + Shopify
  // cleanup) one at a time rather than a separate bulk endpoint — one less
  // place for the delete logic to drift out of sync, and it's already
  // proven correct.
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setBulkDeleteProgress(0);
    const ids = [...selectedIds];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      try {
        const res = await fetch(`/api/admin/users/${ids[i]}`, { method: "DELETE" });
        if (res.ok) succeeded++;
        else failed++;
      } catch {
        failed++;
      }
      setBulkDeleteProgress(i + 1);
    }

    if (succeeded) {
      const deletedSet = new Set(ids);
      setAllUsers((prev) => prev.filter((u) => !deletedSet.has(u._id)));
    }
    if (failed) {
      toast.error(`${succeeded} deleted, ${failed} failed — see individual rows to retry.`);
    } else {
      toast.success(`${succeeded} ${succeeded === 1 ? "account" : "accounts"} deleted.`);
    }

    setSelectedIds(new Set());
    setShowBulkDelete(false);
    setBulkDeleting(false);
  };

  const hasActiveFilters =
    search ||
    filterCountry ||
    filterCity ||
    filterVerification ||
    filterLocation ||
    dateFrom ||
    dateTo ||
    sortBy !== "newest";

  const getRoleBadge = (role) => {
    const colors = {
      store: "bg-green-100 text-green-700",
      brand: "bg-purple-100 text-purple-700",
      consignor: "bg-blue-100 text-blue-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold sm:!pt-[30px] sm:!pr-[30px] sm:!pb-[20px] sm:!pl-[4px] p-1">Stores & Users</h1>
        <div className="flex items-center gap-3">
          {activeTab === "stores" && (
            <>
              <button
                onClick={() => {
                  setAddStoreError(null);
                  setAddStoreForm(emptyAddStoreForm);
                  setShowAddStore(true);
                }}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                <FaPlus className="text-sm" />
                Add Store
              </button>
              <button
                onClick={() => {
                  setBulkResult(null);
                  setBulkError(null);
                  setShowBulkUpload(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                <FaUpload className="text-sm" />
                Upload CSV
              </button>
              <button
                onClick={() => {
                  setGeocodeError(null);
                  setGeocodeStats({ processed: 0, resolved: 0, failed: 0, totalPending: null });
                  setShowGeocode(true);
                }}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                <FaMapMarkedAlt className="text-sm" />
                Locate Pending Stores
              </button>
            </>
          )}
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
          >
            <FaDownload className="text-sm" />
            Download CSV
          </button>
          <Link
            href="/admin/stores-users/deleted"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg text-lg font-semibold transition-colors border border-gray-200"
          >
            <FaHistory className="text-sm" />
            Deleted Stores
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSelectedIds(new Set());
            }}
            className={`px-6 py-2.5 rounded-md text-[12px] font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-sm bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              {tab.key === "stores"
                ? allUsers.filter((u) => u.role === "store").length
                : allUsers.filter((u) => u.role !== "store").length}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Sort + Filter Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch">
          {/* Search */}
          <div className="relative sm:!w-[660px] w-full">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xl pointer-events-none" />

            <input
              type="text"
              placeholder="Search by name, email, or store"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
      w-full
      h-[48px]
      !pl-12
      pr-4
      bg-gray-50
      border
      border-gray-300
      rounded-lg
      text-base
      text-gray-900
      placeholder-gray-400
      leading-none
      focus:outline-none
      focus:ring-2
      focus:ring-indigo-500
      focus:border-indigo-500
      focus:bg-white
    "
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full lg:w-auto h-[48px] px-4 border border-gray-300 rounded-lg text-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white lg:min-w-[180px] cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 w-full lg:w-auto h-[48px] px-6 rounded-lg text-lg font-semibold border transition-colors cursor-pointer ${
              showFilters || hasActiveFilters
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <FaFilter />
            Filters
            {hasActiveFilters && (
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Country */}
              <div>
                <label className="block text-base font-semibold text-gray-600 mb-1.5">
                  Country
                </label>
                <select
                  value={filterCountry}
                  onChange={(e) => {
                    setFilterCountry(e.target.value);
                    setFilterCity("");
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-base font-semibold text-gray-600 mb-1.5">
                  City
                </label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification (stores only) */}
              {activeTab === "stores" && (
                <div>
                  <label className="block text-base font-semibold text-gray-600 mb-1.5">
                    Verification
                  </label>
                  <select
                    value={filterVerification}
                    onChange={(e) => setFilterVerification(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Not Verified</option>
                  </select>
                </div>
              )}

              {/* Date From */}
              <div>
                <label className="block text-base font-semibold text-gray-600 mb-1.5">
                  Signed Up From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-base font-semibold text-gray-600 mb-1.5">
                  Signed Up To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 flex items-center gap-1 text-base text-red-500 hover:text-red-700 transition-colors"
              >
                <MdClose className="text-base" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count + quick verification filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-lg font-medium text-gray-600">
          Showing {(currentPage - 1) * perPage + 1}-
          {Math.min(currentPage * perPage, filteredUsers.length)} out of{" "}
          {filteredUsers.length} {activeTab === "stores" ? "store" : "user"}
          {filteredUsers.length !== 1 ? "s" : ""}
        </div>

        {activeTab === "stores" && (
          <div className="inline-flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                setFilterVerification((prev) =>
                  prev === "verified" ? "" : "verified",
                )
              }
              className={`px-4 py-2 text-md font-semibold transition-colors ${
                filterVerification === "verified"
                  ? "bg-green-600 text-white"
                  : "bg-white text-green-700 hover:bg-green-50"
              }`}
            >
              Verified
            </button>
            <button
              onClick={() =>
                setFilterVerification((prev) =>
                  prev === "unverified" ? "" : "unverified",
                )
              }
              className={`px-4 py-2 text-md font-semibold border-l border-gray-200 transition-colors ${
                filterVerification === "unverified"
                  ? "bg-amber-600 text-white"
                  : "bg-white text-amber-700 hover:bg-amber-50"
              }`}
            >
              Not Verified
            </button>
            <button
              onClick={() =>
                setFilterLocation((prev) => (prev === "missing" ? "" : "missing"))
              }
              title="Stores with no latitude/longitude — these don't show as pins on the Discover map"
              className={`px-4 py-2 text-md font-semibold border-l border-gray-200 transition-colors ${
                filterLocation === "missing"
                  ? "bg-red-600 text-white"
                  : "bg-white text-red-700 hover:bg-red-50"
              }`}
            >
              Missing Location
            </button>
          </div>
        )}
      </div>

      {/* Bulk selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3">
          <span className="text-md font-semibold text-indigo-900">
            {selectedIds.size} {activeTab === "stores" ? "store" : "user"}
            {selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-md font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Clear
            </button>
            <button
              onClick={() => setShowBulkDelete(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 text-md"
            >
              <FaTrash className="text-sm" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No {activeTab === "stores" ? "stores" : "users"} found.
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedIds.has(u._id))}
                    onChange={toggleSelectPage}
                    className="w-4 h-4 rounded border-gray-300 accent-indigo-600"
                  />
                </th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                  Name
                </th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                  Role
                </th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                  Email
                </th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                  Phone
                </th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                  Country / City
                </th>
                {activeTab === "stores" && (
                  <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                    CVR Number
                  </th>
                )}
                <th className="text-center px-4 py-3.5 font-bold text-gray-700">
                  Products
                </th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                  Status
                </th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                  Joined
                </th>
                <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => {
                const joined = getJoinedDate(user);
                return (
                  <tr
                    key={user._id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user._id)}
                        onChange={() => toggleSelected(user._id)}
                        className="w-4 h-4 rounded border-gray-300 accent-indigo-600"
                      />
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.firstname} {user.lastname}
                        {user.role === "store" && user.isVerified === false && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Not Verified
                          </span>
                        )}
                        {user.addedByAdmin && (
                          <span
                            title="Created through the admin Add Store form, not a self sign-up"
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700"
                          >
                            Added by Admin
                          </span>
                        )}
                        {user.role === "store" &&
                          user.email?.toLowerCase().endsWith("@ree-unclaimed.internal") && (
                            <span
                              title="No login yet — automatically linked to the real owner's account when they sign up"
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                            >
                              Unclaimed
                            </span>
                          )}
                      </div>
                      {(user.storename || user.brandname) && (
                        <div className="text-[13px] text-gray-400 font-normal mt-0.5">
                          {user.storename || user.brandname}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`capitalize px-2.5 py-1 rounded-full text-[12px] font-semibold ${getRoleBadge(
                          user.role,
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">{user.email}</td>
                    <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">
                      {user.phone || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {user.country || user.city ? (
                        <>
                          {user.country || ""}
                          {user.country && user.city && " / "}
                          {user.city || ""}
                        </>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    {activeTab === "stores" && (
                      <td className="px-4 py-3.5 text-gray-700">
                        {user.businessNumber || (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 font-bold rounded-full w-8 h-8 text-[12px]">
                        {user.productCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.isActive === true ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          Active
                        </span>
                      ) : user.isActive === false ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-red-600">
                          <span className="w-2 h-2 bg-red-500 rounded-full" />
                          Inactive
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      {joined
                        ? joined.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {activeTab === "stores" && (
                          <>
                            <Link
                              href={`/admin/store-details/${user._id}`}
                              title="View"
                              className="inline-flex items-center justify-center w-9 h-9 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                            >
                              <FaEye className="text-md" />
                            </Link>
                            <Link
                              href={`/admin/store-details/${user._id}?edit=true`}
                              title="Edit"
                              className="inline-flex items-center justify-center w-9 h-9 text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                            >
                              <FaEdit className="text-md" />
                            </Link>
                            {user.isVerified === false && (
                              <button
                                onClick={() => handleQuickVerify(user)}
                                disabled={verifyingId === user._id}
                                title="Mark as Verified"
                                className="inline-flex items-center justify-center w-9 h-9 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {verifyingId === user._id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FaCheckCircle className="text-md" />
                                )}
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setDeleteTarget(user)}
                          title="Delete"
                          className="inline-flex items-center justify-center w-9 h-9 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination — windowed (first/last + a few around the current page),
          not one button per page. With 100+ pages of stores, rendering
          every page number in a single row is what was forcing the whole
          table to scroll absurdly wide and leaving a huge blank gap - not
          the font size. */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-[14px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {getPaginationItems(currentPage, totalPages).map((item, i) =>
            item === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-[14px]">
                …
              </span>
            ) : (
              <button
                key={item}
                onClick={() => setCurrentPage(item)}
                className={`w-9 h-9 rounded-lg text-[14px] font-semibold transition-colors ${
                  currentPage === item
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item}
              </button>
            ),
          )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg text-[14px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Add single store modal */}
      {showAddStore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !addingStore && setShowAddStore(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Add Store</h3>
            <p className="text-gray-600 mb-5">
              Store Name, Country and CVR are the only required fields. Leave Email
              blank to add it as an unclaimed listing — it'll show up everywhere a
              normal store does, just with no login until the real owner signs up,
              at which point it's automatically linked to their new account instead
              of creating a duplicate. Checked against existing stores by name and
              CVR first — if either already exists, you'll be pointed to that entry
              instead of creating a duplicate.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">First Name</span>
                <span className="text-gray-400 text-sm"> (optional if unknown)</span>
                <input
                  value={addStoreForm.firstname}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, firstname: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Last Name</span>
                <span className="text-gray-400 text-sm"> (optional if unknown)</span>
                <input
                  value={addStoreForm.lastname}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, lastname: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>

              <label className="block col-span-2">
                <span className="text-sm font-semibold text-gray-700">Store Name *</span>
                <input
                  value={addStoreForm.storename}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, storename: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>

              <label className="block col-span-2">
                <span className="text-sm font-semibold text-gray-700">Country *</span>
                <select
                  value={addStoreForm.country}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, country: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white"
                >
                  <option value="">Select Country</option>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>

              <label className="block col-span-2">
                <span className="text-sm font-semibold text-gray-700">Business Registration Number (VAT/CVR) *</span>
                <input
                  value={addStoreForm.businessNumber}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, businessNumber: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>

              <label className="block col-span-2">
                <span className="text-sm font-semibold text-gray-700">Phone</span>
                <span className="text-gray-400 text-sm"> (optional if unknown)</span>
                <PhoneInput
                  international
                  defaultCountry="DK"
                  value={addStoreForm.phone}
                  onChange={(value) => setAddStoreForm((f) => ({ ...f, phone: value || "" }))}
                  placeholder="Enter phone number"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base [&_input]:outline-none"
                />
              </label>

              <label className="block col-span-2">
                <span className="text-sm font-semibold text-gray-700">Email</span>
                <span className="text-gray-400 text-sm">
                  {" "}
                  (optional — leave blank to add as an unclaimed listing with no login yet)
                </span>
                <input
                  value={addStoreForm.email}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>

              {addStoreForm.email.trim() && (
                <label className="block col-span-2">
                  <span className="text-sm font-semibold text-gray-700">Password *</span>
                  <div className="relative mt-1">
                    <input
                      type={showAddStorePassword ? "text" : "password"}
                      value={addStoreForm.password}
                      onChange={(e) => setAddStoreForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddStorePassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showAddStorePassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </label>
              )}

              <div className="col-span-2 pt-2 mt-2 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Address</span>
                <span className="text-gray-400 text-sm">
                  {" "}
                  (optional, but needed for the store to show on the map/search page)
                </span>
              </div>

              <label className="block col-span-2">
                <span className="text-sm font-semibold text-gray-700">Street Address</span>
                <input
                  value={addStoreForm.address}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, address: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">City</span>
                <input
                  value={addStoreForm.city}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, city: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Zipcode</span>
                <input
                  value={addStoreForm.zipcode}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, zipcode: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>
              <label className="block col-span-2">
                <span className="text-sm font-semibold text-gray-700">State / Region</span>
                <input
                  value={addStoreForm.state}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, state: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Latitude</span>
                <span className="text-gray-400 text-sm"> (optional)</span>
                <input
                  type="number"
                  step="any"
                  value={addStoreForm.latitude}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, latitude: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Longitude</span>
                <span className="text-gray-400 text-sm"> (optional)</span>
                <input
                  type="number"
                  step="any"
                  value={addStoreForm.longitude}
                  onChange={(e) => setAddStoreForm((f) => ({ ...f, longitude: e.target.value }))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base"
                />
              </label>
              <p className="col-span-2 text-gray-400 text-sm -mt-2">
                Leave latitude/longitude blank and Discover will locate it automatically from the
                address — filling them in here places it on the map immediately instead of waiting.
              </p>

              <div className="col-span-2">
                <span className="text-sm font-semibold text-gray-700">Store Photo</span>
                <span className="text-gray-400 text-sm"> (optional)</span>
                <div className="mt-1 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {addStoreForm.logoUrl ? (
                      <img src={addStoreForm.logoUrl} alt="Store" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-xs text-center px-1">No photo</span>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                      {uploadingStorePhoto ? "Uploading..." : "Upload Photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingStorePhoto}
                      onChange={(e) => handleStorePhotoUpload(e, setAddStoreForm)}
                      className="hidden"
                    />
                  </label>
                  {addStoreForm.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setAddStoreForm((f) => ({ ...f, logoUrl: "", logoPublicId: "" }))}
                      title="Remove photo"
                      className="inline-flex items-center justify-center w-9 h-9 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {addStoreError && <p className="text-red-500 text-md mt-4">{addStoreError}</p>}

            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={() => setShowAddStore(false)}
                disabled={addingStore}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStore}
                disabled={
                  addingStore ||
                  uploadingStorePhoto ||
                  !addStoreForm.storename.trim() ||
                  !addStoreForm.country.trim() ||
                  !addStoreForm.businessNumber.trim() ||
                  (addStoreForm.phone && !isValidPhoneNumber(addStoreForm.phone)) ||
                  (addStoreForm.email.trim() && !addStoreForm.password)
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-50"
              >
                {addingStore ? <><Spinner size="sm" color="white" /> Adding...</> : "Add Store"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV bulk upload modal */}
      {showBulkUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !bulkUploading && setShowBulkUpload(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Bulk Upload Stores from CSV
            </h3>
            <p className="text-gray-600 mb-4">
              Upload a spreadsheet of stores. Matched by store name first, then
              CVR/business number — a match updates that store's info instead of
              creating a duplicate. New stores are added as{" "}
              <span className="font-semibold">Not Verified</span>.
            </p>

            <button
              onClick={downloadCsvTemplate}
              className="text-indigo-600 hover:text-indigo-800 text-md font-semibold underline mb-4"
            >
              Download CSV template
            </button>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFileSelected}
                disabled={bulkUploading}
                className="w-full"
              />
              {bulkUploading && (
                <div className="flex justify-center mt-3">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {bulkError && (
              <p className="text-red-500 text-md mt-4">{bulkError}</p>
            )}

            {bulkResult && (
              <div className="mt-5 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1 text-center bg-green-50 border border-green-200 rounded-lg py-3">
                    <p className="text-2xl font-bold text-green-700">
                      {bulkResult.createdCount}
                    </p>
                    <p className="text-md text-gray-600">Added</p>
                  </div>
                  <div className="flex-1 text-center bg-amber-50 border border-amber-200 rounded-lg py-3">
                    <p className="text-2xl font-bold text-amber-700">
                      {bulkResult.updatedCount}
                    </p>
                    <p className="text-md text-gray-600">Matched &amp; updated</p>
                  </div>
                  <div className="flex-1 text-center bg-red-50 border border-red-200 rounded-lg py-3">
                    <p className="text-2xl font-bold text-red-600">
                      {bulkResult.errorCount}
                    </p>
                    <p className="text-md text-gray-600">Errors</p>
                  </div>
                </div>

                {bulkResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-md text-red-600 bg-red-50 rounded-lg p-3">
                    {bulkResult.errors.map((e, i) => (
                      <div key={i}>
                        Row {e.row}: {e.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBulkUpload(false)}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locate Pending Stores modal */}
      {showGeocode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !geocoding && setShowGeocode(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Locate Pending Stores</h3>
            <p className="text-gray-600 mb-5">
              Looks up map coordinates for every store that has an address but no
              location yet, and saves them straight to the store — a handful at a
              time, respecting the map-lookup service's rate limit, looping
              automatically until it's done or you stop it.
            </p>

            {!geocoding && (
              <button
                onClick={runGeocodePending}
                disabled={geocodeOnCooldown}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-colors ${
                  geocodeOnCooldown
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "text-white bg-green-600 hover:bg-green-700"
                }`}
              >
                <FaMapMarkedAlt className="text-sm" />
                {geocodeOnCooldown
                  ? `Available in ${Math.floor(geocodeSecondsLeft / 60)}:${String(geocodeSecondsLeft % 60).padStart(2, "0")}`
                  : geocodeStats.processed > 0
                    ? "Go — Run Again"
                    : "Go — Start"}
              </button>
            )}
            {geocodeOnCooldown && !geocoding && (
              <p className="text-gray-400 text-md mt-2">
                Cooling down for a few minutes between runs so the free map-lookup
                service doesn't get hammered — you can run it again once the timer's up.
              </p>
            )}

            {(geocoding || geocodeStats.processed > 0) && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1 text-center bg-gray-50 border border-gray-200 rounded-lg py-3">
                    <p className="text-2xl font-bold text-gray-700">{geocodeStats.processed}</p>
                    <p className="text-md text-gray-600">Checked</p>
                  </div>
                  <div className="flex-1 text-center bg-green-50 border border-green-200 rounded-lg py-3">
                    <p className="text-2xl font-bold text-green-700">{geocodeStats.resolved}</p>
                    <p className="text-md text-gray-600">Located</p>
                  </div>
                  <div className="flex-1 text-center bg-amber-50 border border-amber-200 rounded-lg py-3">
                    <p className="text-2xl font-bold text-amber-700">{geocodeStats.failed}</p>
                    <p className="text-md text-gray-600">Couldn't resolve</p>
                  </div>
                </div>
                {geocodeStats.totalPending !== null && (
                  <p className="text-gray-500 text-md">
                    {geocodeStats.totalPending} store{geocodeStats.totalPending !== 1 ? "s" : ""} still
                    waiting overall.
                  </p>
                )}
                {geocoding && (
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" />
                    <span className="text-gray-600 text-md">Working through the list...</span>
                  </div>
                )}
              </div>
            )}

            {geocodeError && <p className="text-red-500 text-md mt-4">{geocodeError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              {geocoding ? (
                <button
                  onClick={stopGeocodePending}
                  className="px-5 py-2.5 rounded-lg font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => setShowGeocode(false)}
                  className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900">
                  Delete this {deleteTarget.role === "store" ? "store" : "user"}?
                </h3>
                <p className="mt-2 text-lg text-gray-600 leading-relaxed">
                  You're about to permanently delete{" "}
                  <span className="font-semibold text-gray-900">
                    {deleteTarget.firstname} {deleteTarget.lastname}
                  </span>{" "}
                  ({deleteTarget.email}).
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-red-50 border border-red-100 p-5 text-lg text-red-700 leading-relaxed">
              This removes the account and{" "}
              <span className="font-semibold">all associated data</span> —
              products (also from Shopify), subscriptions, transactions,
              notifications and more. A full backup is saved automatically,
              so if this was a mistake it can be restored from{" "}
              <span className="font-semibold">Deleted Stores</span>.
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="text-sm" />
                    Delete permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation modal */}
      {showBulkDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !bulkDeleting && setShowBulkDelete(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900">
                  Delete {selectedIds.size} {activeTab === "stores" ? "stores" : "users"}?
                </h3>
                <p className="mt-2 text-lg text-gray-600 leading-relaxed">
                  You're about to permanently delete{" "}
                  <span className="font-semibold text-gray-900">{selectedIds.size}</span> selected{" "}
                  {activeTab === "stores" ? "stores" : "users"}.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-red-50 border border-red-100 p-5 text-lg text-red-700 leading-relaxed">
              This removes each account and{" "}
              <span className="font-semibold">all associated data</span> —
              products (also from Shopify), subscriptions, transactions,
              notifications and more. A full backup is saved automatically for
              each one, so if this was a mistake they can be restored from{" "}
              <span className="font-semibold">Deleted Stores</span>.
            </div>

            {bulkDeleting && (
              <div className="mt-5">
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-red-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${(bulkDeleteProgress / selectedIds.size) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-md text-gray-600">
                  Deleting {bulkDeleteProgress} of {selectedIds.size}...
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDelete(false)}
                disabled={bulkDeleting}
                className="px-5 py-2.5 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {bulkDeleting ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="text-sm" />
                    Delete permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoresUsersPage;
