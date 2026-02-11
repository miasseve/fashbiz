"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Spinner } from "@heroui/react";
import { FaSearch, FaFilter, FaThLarge, FaList } from "react-icons/fa";
import { MdClose } from "react-icons/md";

const STATUS_OPTIONS = [
  { value: "", label: "All Products" },
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price-high", label: "Price High-Low" },
  { value: "price-low", label: "Price Low-High" },
  { value: "name-asc", label: "Name A-Z" },
];

const AdminProductsPage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        setAllProducts(data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Derive unique brands and stores
  const brands = useMemo(() => {
    const set = new Set(allProducts.map((p) => p.brand).filter(Boolean));
    return [...set].sort();
  }, [allProducts]);

  const stores = useMemo(() => {
    const map = new Map();
    allProducts.forEach((p) => {
      if (p.userId) {
        const id = p.userId._id;
        if (!map.has(id)) {
          const name =
            p.userId.storename || `${p.userId.firstname} ${p.userId.lastname}`;
          map.set(id, { id, name, count: 0 });
        }
        map.get(id).count++;
      }
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  // Filter + sort
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    // Status
    if (statusFilter === "active") {
      list = list.filter((p) => !p.sold && !p.archived);
    } else if (statusFilter === "sold") {
      list = list.filter((p) => p.sold);
    } else if (statusFilter === "archived") {
      list = list.filter((p) => p.archived);
    }

    // Brand
    if (brandFilter) {
      list = list.filter((p) => p.brand === brandFilter);
    }

    // Store
    if (storeFilter) {
      list = list.filter((p) => p.userId && p.userId._id === storeFilter);
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "price-high":
          return b.price - a.price;
        case "price-low":
          return a.price - b.price;
        case "name-asc":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return list;
  }, [allProducts, search, statusFilter, brandFilter, storeFilter, sortBy]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, brandFilter, storeFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setBrandFilter("");
    setStoreFilter("");
    setSortBy("newest");
  };

  const hasActiveFilters =
    search || statusFilter || brandFilter || storeFilter || sortBy !== "newest";

  const getStatusBadge = (product) => {
    if (product.sold)
      return {
        label: "Sold",
        cls: "text-orange-700 bg-orange-100",
      };
    if (product.archived)
      return {
        label: "Archived",
        cls: "text-gray-600 bg-gray-100",
      };
    return {
      label: "Active",
      cls: "text-green-700 bg-green-100",
    };
  };

  const selectedStore = stores.find((s) => s.id === storeFilter);

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
        <h1 className="text-4xl font-bold sm:!pt-[30px] sm:!pr-[30px] sm:!pb-[20px] sm:!pl-[4px] p-1">Products</h1>
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("list")}
            className={`p-3 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaList className="text-xl" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-3 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FaThLarge className="text-xl" />
          </button>
        </div>
      </div>

      {/* Search + Sort + Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch">
          {/* Search */}
          <div className="relative sm:!w-[660px] w-full">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xl pointer-events-none" />

            <input
              type="text"
              placeholder="Search products…"
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

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-auto h-[48px] px-4 border border-gray-300 rounded-lg text-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white lg:min-w-[170px] cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Brand */}
              <div>
                <label className="block text-base font-semibold text-gray-600 mb-1.5">
                  Brand
                </label>
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Store */}
              <div>
                <label className="block text-base font-semibold text-gray-600 mb-1.5">
                  Store
                </label>
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Stores</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.count} products)
                    </option>
                  ))}
                </select>
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

      {/* Store info banner */}
      {selectedStore && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-indigo-800">
              {selectedStore.name}
            </span>
            <span className="ml-3 text-base text-indigo-600">
              {selectedStore.count} total products
            </span>
          </div>
          <button
            onClick={() => setStoreFilter("")}
            className="text-indigo-500 hover:text-indigo-700"
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      )}

      {/* Results count */}
      {filteredProducts.length > 0 ? (
        <div className="text-sm sm:text-lg font-medium text-gray-600">
          Showing {(currentPage - 1) * perPage + 1}-
          {Math.min(currentPage * perPage, filteredProducts.length)} out of{" "}
          {filteredProducts.length} products
        </div>
      ) : (
        <div className="text-sm sm:text-lg font-medium text-gray-600">
          No products found
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && paginatedProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedProducts.map((product) => {
            const status = getStatusBadge(product);
            const storeName = product.userId
              ? product.userId.storename ||
                `${product.userId.firstname} ${product.userId.lastname}`
              : "Unknown";
            return (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                      No Image
                    </div>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[13px] font-semibold ${status.cls}`}
                  >
                    {status.label}
                  </span>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-gray-800 truncate">
                    {product.title}
                  </h3>
                  <p className="text-[14px] text-gray-500 mt-0.5">
                    {product.category}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gray-800">
                      ${product.price}
                    </span>
                    <span className="text-[13px] text-gray-400">
                      {product.brand}
                    </span>
                  </div>
                  {product.size && product.size.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.size.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-[12px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium"
                        >
                          {s}
                        </span>
                      ))}
                      {product.size.length > 4 && (
                        <span className="text-[12px] text-gray-400">
                          +{product.size.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100 text-[13px] text-gray-400 truncate">
                    {storeName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && paginatedProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm sm:text-[15px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700">
                  Product
                </th>
                <th className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 hidden md:table-cell">
                  Brand
                </th>
                <th className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 hidden lg:table-cell">
                  Category
                </th>
                <th className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700">
                  Price
                </th>
                <th className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 hidden xl:table-cell">
                  Store Owner
                </th>
                <th className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 hidden lg:table-cell">
                  Size
                </th>
                <th className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700">
                  Status
                </th>
                <th className="text-left px-3 sm:px-4 py-3 sm:py-3.5 font-bold text-gray-700 hidden sm:table-cell">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => {
                const status = getStatusBadge(product);
                return (
                  <tr
                    key={product._id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">
                              N/A
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-[200px]">
                          {product.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-700 hidden md:table-cell">
                      {product.brand}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-700 hidden lg:table-cell">
                      {product.category}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-700 font-semibold">
                      ${product.price}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-700 hidden xl:table-cell">
                      {product.userId
                        ? product.userId.storename ||
                          `${product.userId.firstname} ${product.userId.lastname}`
                        : "Unknown"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-600 hidden lg:table-cell">
                      {product.size && product.size.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.size.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[12px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium"
                            >
                              {s}
                            </span>
                          ))}
                          {product.size.length > 3 && (
                            <span className="text-[12px] text-gray-400">
                              +{product.size.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5">
                      <span
                        className={`px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-[14px] font-semibold ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-3.5 text-gray-600 whitespace-nowrap hidden sm:table-cell">
                      {new Date(product.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-[15px] font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
