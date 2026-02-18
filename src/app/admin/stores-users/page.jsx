"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Spinner } from "@heroui/react";
import { FaDownload, FaSearch, FaFilter, FaEye } from "react-icons/fa";
import { MdClose } from "react-icons/md";

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
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
    dateFrom,
    dateTo,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, sortBy, filterCountry, filterCity, dateFrom, dateTo]);

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

  const clearFilters = () => {
    setSearch("");
    setSortBy("newest");
    setFilterCountry("");
    setFilterCity("");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    search ||
    filterCountry ||
    filterCity ||
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
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
        >
          <FaDownload className="text-sm" />
          Download CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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

      {/* Results count */}
      <div className="text-lg font-medium text-gray-600">
        Showing {(currentPage - 1) * perPage + 1}-
        {Math.min(currentPage * perPage, filteredUsers.length)} out of{" "}
        {filteredUsers.length} {activeTab === "stores" ? "store" : "user"}
        {filteredUsers.length !== 1 ? "s" : ""}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No {activeTab === "stores" ? "stores" : "users"} found.
          </p>
        ) : (
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
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
                {activeTab === "stores" && (
                  <th className="text-left px-4 py-3.5 font-bold text-gray-700">
                    Details
                  </th>
                )}
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
                    <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                      {user.firstname} {user.lastname}
                      {(user.storename || user.brandname) && (
                        <div className="text-[13px] text-gray-400 font-normal mt-0.5">
                          {user.storename || user.brandname}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`capitalize px-2.5 py-1 rounded-full text-[14px] font-semibold ${getRoleBadge(
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
                      <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 font-bold rounded-full w-9 h-9 text-[14px]">
                        {user.productCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.isActive === true ? (
                        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-green-700">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          Active
                        </span>
                      ) : user.isActive === false ? (
                        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-red-600">
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
                    {activeTab === "stores" && (
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/store-details/${user._id}`}
                          className="inline-flex items-center gap-1.5 text-md font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          <FaEye className="text-md" /> View
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg text-[15px] font-semibold transition-colors ${
                currentPage === page
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StoresUsersPage;
