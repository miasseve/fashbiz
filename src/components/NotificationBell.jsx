"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { IoNotifications } from "react-icons/io5";
import { IoMdClose } from "react-icons/io";
import { IoMailUnreadOutline, IoMailOpenOutline } from "react-icons/io5";
import { FiExternalLink } from "react-icons/fi";
import { FaBoxOpen } from "react-icons/fa6";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const NotificationBell = () => {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const prevUnreadRef = useRef(0);
  // null until the first poll — that first poll just records whatever's
  // already there as "seen" so logging in with old unread notifications
  // doesn't pop up a toast for every one of them; only notifications that
  // arrive AFTER that get the popup treatment.
  const seenIdsRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread");
      if (!res.ok) return;
      const data = await res.json();
      const newCount = data.count || 0;

      if (newCount > prevUnreadRef.current && isOpen) {
        fetchNotifications();
      }

      prevUnreadRef.current = newCount;
      setUnreadCount(newCount);
    } catch (err) {
      // Silently fail — polling will retry in 5s
    }
  }, [isOpen]);

  // Runs alongside the count poll, on the same interval, so a new
  // notification pops up on-screen no matter which dashboard page the
  // store is on — this component lives in the dashboard layout, not any
  // one page.
  const checkForNewNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (!res.ok) return;
      const data = await res.json();
      const list = data.notifications || [];

      if (seenIdsRef.current === null) {
        seenIdsRef.current = new Set(list.map((n) => n._id));
        return;
      }

      const fresh = list.filter((n) => !seenIdsRef.current.has(n._id));
      fresh.forEach((n) => {
        seenIdsRef.current.add(n._id);
        showNotificationPopup(n);
      });
    } catch (err) {
      // Silently fail — polling will retry in 5s
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotificationPopup = (notification) => {
    const product = notification.productId;
    toast(
      () => (
        <div
          className={product?._id ? "cursor-pointer" : undefined}
          onClick={() => {
            if (product?._id) router.push(`/dashboard/product/${product._id}`);
          }}
        >
          <p className="text-[13px] font-bold text-green-700 mb-1.5">
            {notification.title}
          </p>
          <div className="flex items-center gap-3">
            {product?.images?.[0]?.url && (
              <img
                src={product.images[0].url}
                alt=""
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-gray-900 truncate">
                {product?.title || notification.message}
              </p>
              {product?.price != null && (
                <p className="text-[12px] text-gray-500">{product.price} DKK</p>
              )}
              {!product?.title && notification.message && (
                <p className="text-[12px] text-gray-500 line-clamp-2">
                  {notification.message}
                </p>
              )}
            </div>
          </div>
          {product?._id && (
            <p className="text-[12px] text-blue-600 mt-1.5 inline-flex items-center gap-1">
              View product <FiExternalLink size={11} />
            </p>
          )}
        </div>
      ),
      {
        icon: false,
        autoClose: 15000,
        className: "!border-l-4 !border-l-green-500",
      },
    );
  };

  useEffect(() => {
    fetchUnreadCount();
    checkForNewNotifications();
    const interval = setInterval(() => {
      fetchUnreadCount();
      checkForNewNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, checkForNewNotifications]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) {
        setNotifications([]);
        return;
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) fetchNotifications();
  };

  const handleToggleRead = async (id, currentIsRead) => {
    const newIsRead = !currentIsRead;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: newIsRead }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: newIsRead } : n)),
      );
      if (newIsRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
      } else {
        setUnreadCount((prev) => prev + 1);
        prevUnreadRef.current = prevUnreadRef.current + 1;
      }
    } catch (err) {
      console.error("Failed to toggle notification read status:", err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderAddress = (address) => {
    if (!address) return null;
    const parts = [
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.zip,
      address.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors ${
          unreadCount > 0 ? "animate-pulse" : ""
        }`}
      >
        <IoNotifications
          size={24}
          className={unreadCount > 0 ? "text-green-500" : "text-gray-700"}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-[99] sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown - full screen on mobile, positioned on desktop */}
          <div className="fixed inset-0 z-[100] sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-[420px] sm:max-h-[550px] bg-white sm:rounded-xl sm:shadow-2xl sm:border sm:border-gray-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="font-bold text-[16px]">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-gray-100 rounded p-1"
              >
                <IoMdClose size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 sm:max-h-[420px] bg-white">
              {loading ? (
                <div className="py-8 text-center text-gray-400 text-[15px]">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-[15px]">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => {
                  // Populated by the API when the notification references a
                  // product (e.g. a reservation) — a plain id, or absent for
                  // store-wide notifications like the daily reminder.
                  const productId = notification.productId?._id;
                  return (
                  <div
                    key={notification._id}
                    className={`px-4 sm:px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? "bg-blue-50/50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.isRead && (
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                      )}
                      {notification.isRead && (
                        <FaBoxOpen
                          size={16}
                          className="text-gray-300 mt-1.5 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="flex-1 min-w-0"
                            onClick={() => {
                              if (!notification.isRead)
                                handleToggleRead(
                                  notification._id,
                                  notification.isRead,
                                );
                              if (productId) {
                                setIsOpen(false);
                                router.push(`/dashboard/product/${productId}`);
                              }
                            }}
                          >
                            <p className="text-[14px] sm:text-[15px] font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-[12px] sm:text-[13px] text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            {productId && (
                              <p className="text-[12px] sm:text-[13px] text-blue-600 mt-1 inline-flex items-center gap-1">
                                View product <FiExternalLink size={12} />
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              handleToggleRead(
                                notification._id,
                                notification.isRead,
                              )
                            }
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                            title={
                              notification.isRead
                                ? "Mark as unread"
                                : "Mark as read"
                            }
                          >
                            {notification.isRead ? (
                              <IoMailUnreadOutline size={16} />
                            ) : (
                              <IoMailOpenOutline size={16} />
                            )}
                          </button>
                        </div>

                        {notification.orderDetails?.fulfillmentMethod && (
                          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-1">
                            {notification.orderDetails.fulfillmentMethod ===
                            "shipping"
                              ? "Shipping"
                              : "Store Pickup"}
                            {notification.orderDetails.shippingAddress &&
                              notification.orderDetails.fulfillmentMethod ===
                                "shipping" && (
                                <span>
                                  {" "}
                                  &middot;{" "}
                                  {renderAddress(
                                    notification.orderDetails.shippingAddress,
                                  )}
                                </span>
                              )}
                          </p>
                        )}

                        {notification.orderDetails?.totalPrice && (
                          <p className="text-[13px] sm:text-[14px] font-semibold text-gray-700 mt-1">
                            {notification.orderDetails.totalPrice}{" "}
                            {notification.orderDetails.currency || "DKK"}
                          </p>
                        )}

                        {notification.orderDetails?.shopifyOrderUrl && (
                          <a
                            href={notification.orderDetails.shopifyOrderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] sm:text-[13px] text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Order <FiExternalLink size={12} />
                          </a>
                        )}

                        <p className="text-[11px] sm:text-[12px] text-gray-400 mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>

            {/* View All link */}
            <div className="border-t border-gray-100 bg-white shrink-0">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center py-3 text-md font-semibold text-blue-600 hover:bg-gray-50 transition-colors"
              >
                View All Notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
