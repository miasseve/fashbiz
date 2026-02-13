"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { FiExternalLink, FiTrash2 } from "react-icons/fi";
import { FaBoxOpen } from "react-icons/fa6";
import { IoNotifications } from "react-icons/io5";
import { IoMailUnreadOutline, IoMailOpenOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=100");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
    } catch (err) {
      console.error("Failed to toggle notification read status:", err);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete this notification?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn-danger",
      },
    });

    if (!result.isConfirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (selectedNotification?._id === id) {
          setSelectedNotification(null);
        }
        toast.success("Notification deleted");
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (err) {
      toast.error("Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400 text-lg">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IoNotifications size={28} className="text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-md font-bold rounded-full px-2.5 py-0.5">
              {notifications.filter((n) => !n.isRead).length} unread
            </span>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <IoNotifications size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No notifications yet
          </h2>
          <p className="text-gray-400">
            You&apos;ll see notifications here when products are sold.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`px-6 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                !notification.isRead ? "bg-blue-50/40" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Unread indicator */}
                <div className="pt-1.5 shrink-0">
                  {!notification.isRead ? (
                    <span className="block w-3 h-3 bg-blue-500 rounded-full" />
                  ) : (
                    <FaBoxOpen size={18} className="text-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (!notification.isRead)
                      handleToggleRead(notification._id, notification.isRead);
                    if (notification.orderDetails) {
                      setSelectedNotification(notification);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-md font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-1">
                        {notification.message}
                      </p>

                      {notification.orderDetails?.totalPrice && (
                        <p className="text-md font-semibold text-gray-700 mt-1.5">
                          {notification.orderDetails.totalPrice}{" "}
                          {notification.orderDetails.currency || "DKK"}
                        </p>
                      )}

                      <p className="text-[12px] text-gray-400 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleRead(
                            notification._id,
                            notification.isRead,
                          );
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={
                          notification.isRead
                            ? "Mark as unread"
                            : "Mark as read"
                        }
                      >
                        {notification.isRead ? (
                          <IoMailUnreadOutline size={18} />
                        ) : (
                          <IoMailOpenOutline size={18} />
                        )}
                      </button>
                      {notification.orderDetails?.shopifyOrderUrl && (
                        <a
                          href={notification.orderDetails.shopifyOrderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title="View on Shopify"
                        >
                          <FiExternalLink size={18} />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                        disabled={deletingId === notification._id}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete notification"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal - HeroUI */}
      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        size="lg"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent>
          {selectedNotification && (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900">
                Order Details
              </ModalHeader>
              <ModalBody>
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-md text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                      Notification
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedNotification.title}
                    </p>
                    <p className="text-base text-gray-500 mt-1">
                      {selectedNotification.message}
                    </p>
                  </div>

                  {selectedNotification.orderDetails?.customerName && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-md text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                        Customer
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedNotification.orderDetails.customerName}
                      </p>
                      {selectedNotification.orderDetails.customerEmail && (
                        <p className="text-[12px] text-gray-500 mt-1">
                          {selectedNotification.orderDetails.customerEmail}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedNotification.orderDetails?.fulfillmentMethod && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                          Fulfillment
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {selectedNotification.orderDetails
                            .fulfillmentMethod === "shipping"
                            ? "Shipping"
                            : "Store Pickup"}
                        </p>
                      </div>
                    )}

                    {selectedNotification.orderDetails?.totalPrice && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                          Order Total
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedNotification.orderDetails.totalPrice}{" "}
                          {selectedNotification.orderDetails.currency || "DKK"}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedNotification.orderDetails?.shippingAddress && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-md text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                        Shipping Address
                      </p>
                      <p className="text-[12px] text-gray-900">
                        {[
                          selectedNotification.orderDetails.shippingAddress
                            .address1,
                          selectedNotification.orderDetails.shippingAddress
                            .address2,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-[12px] text-gray-900">
                        {[
                          selectedNotification.orderDetails.shippingAddress.city,
                          selectedNotification.orderDetails.shippingAddress
                            .province,
                          selectedNotification.orderDetails.shippingAddress.zip,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-[12px] text-gray-900">
                        {
                          selectedNotification.orderDetails.shippingAddress
                            .country
                        }
                      </p>
                    </div>
                  )}

                  {selectedNotification.orderDetails?.shopifyOrderUrl && (
                    <a
                      href={selectedNotification.orderDetails.shopifyOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-base font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      View on Shopify <FiExternalLink size={16} />
                    </a>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  size="md"
                  onPress={() => setSelectedNotification(null)}
                  className="success-btn px-6"
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default NotificationsPage;
