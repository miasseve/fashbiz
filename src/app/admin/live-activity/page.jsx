"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Spinner } from "@heroui/react";
import { FaSort, FaSortUp, FaSortDown, FaFilter } from "react-icons/fa";
import { MdClose } from "react-icons/md";

const LiveActivityPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Sort & filter state
  const [sortKey, setSortKey] = useState("lastActiveAt");
  const [sortDir, setSortDir] = useState("desc");
  const [storeFilter, setStoreFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/admin/live-activity");
        const data = await res.json();
        setSessions(data.activeSessions || []);
      } catch (error) {
        console.error("Failed to fetch live activity:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Derive unique store names for the filter dropdown
  const storeNames = useMemo(() => {
    const set = new Set();
    sessions.forEach((s) => {
      const name = s.userId?.storename;
      if (name) set.add(name);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [sessions]);

  // Derive unique roles for filter
  const roles = useMemo(() => {
    const set = new Set();
    sessions.forEach((s) => {
      if (s.userId?.role) set.add(s.userId.role);
    });
    return [...set].sort();
  }, [sessions]);

  // Filter + sort
  const filteredSessions = useMemo(() => {
    let list = sessions;

    if (storeFilter) {
      list = list.filter((s) => s.userId?.storename === storeFilter);
    }

    if (roleFilter) {
      list = list.filter((s) => s.userId?.role === roleFilter);
    }

    list = [...list].sort((a, b) => {
      let valA, valB;

      switch (sortKey) {
        case "name":
          valA = a.userId
            ? `${a.userId.firstname} ${a.userId.lastname}`.toLowerCase()
            : "";
          valB = b.userId
            ? `${b.userId.firstname} ${b.userId.lastname}`.toLowerCase()
            : "";
          return sortDir === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        case "store":
          valA = (a.userId?.storename || "").toLowerCase();
          valB = (b.userId?.storename || "").toLowerCase();
          return sortDir === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        case "email":
          valA = (a.userId?.email || "").toLowerCase();
          valB = (b.userId?.email || "").toLowerCase();
          return sortDir === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        case "role":
          valA = (a.userId?.role || "").toLowerCase();
          valB = (b.userId?.role || "").toLowerCase();
          return sortDir === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        case "lastActiveAt":
        default:
          valA = new Date(a.lastActiveAt).getTime();
          valB = new Date(b.lastActiveAt).getTime();
          return sortDir === "asc" ? valA - valB : valB - valA;
      }
    });

    return list;
  }, [sessions, storeFilter, roleFilter, sortKey, sortDir]);

  // Reset page on filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [storeFilter, roleFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredSessions.length / perPage);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "lastActiveAt" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey)
      return <FaSort className="inline ml-1 text-gray-300 text-xs" />;
    return sortDir === "asc" ? (
      <FaSortUp className="inline ml-1 text-indigo-500 text-xs" />
    ) : (
      <FaSortDown className="inline ml-1 text-indigo-500 text-xs" />
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      store: "bg-green-100 text-green-700",
      brand: "bg-purple-100 text-purple-700",
      consignor: "bg-blue-100 text-blue-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const hasActiveFilters = storeFilter || roleFilter;

  const clearFilters = () => {
    setStoreFilter("");
    setRoleFilter("");
    setSortKey("lastActiveAt");
    setSortDir("desc");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">Live Activity</h1>
        <span className="text-sm sm:text-base text-gray-500 font-medium">
          {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Store filter */}
          <div className="flex-1">
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Stores</option>
              {storeNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Role filter */}
          <div className="flex-1 sm:max-w-[200px]">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 px-4 py-3 rounded-lg text-base text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
            >
              <MdClose className="text-lg" />
              Clear
            </button>
          )}
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-center py-8 text-lg">
            No active sessions found.
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm sm:text-lg font-medium text-gray-600">
            Showing {(currentPage - 1) * perPage + 1}-
            {Math.min(currentPage * perPage, filteredSessions.length)} out of{" "}
            {filteredSessions.length} entries
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm sm:text-[15px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th
                    onClick={() => handleSort("name")}
                    className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                  >
                    Name <SortIcon columnKey="name" />
                  </th>
                  <th
                    onClick={() => handleSort("store")}
                    className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                  >
                    Store <SortIcon columnKey="store" />
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors hidden md:table-cell"
                  >
                    Email <SortIcon columnKey="email" />
                  </th>
                  <th
                    onClick={() => handleSort("role")}
                    className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors hidden sm:table-cell"
                  >
                    Role <SortIcon columnKey="role" />
                  </th>
                  <th
                    onClick={() => handleSort("lastActiveAt")}
                    className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                  >
                    Last Login Time <SortIcon columnKey="lastActiveAt" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSessions.map((session) => (
                  <tr
                    key={session._id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                      {session.userId
                        ? `${session.userId.firstname} ${session.userId.lastname}`
                        : "Unknown"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-700 whitespace-nowrap">
                      {session.userId?.storename || (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-700 hidden md:table-cell">
                      {session.userId?.email || "N/A"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 hidden sm:table-cell">
                      <span
                        className={`capitalize px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-[14px] font-semibold ${getRoleBadge(
                          session.userId?.role
                        )}`}
                      >
                        {session.userId?.role || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-600 whitespace-nowrap">
                      {new Date(session.lastActiveAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-[15px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm sm:text-[15px] font-semibold transition-colors ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-[15px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LiveActivityPage;
