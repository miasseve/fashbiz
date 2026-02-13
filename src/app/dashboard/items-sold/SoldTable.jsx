"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { deleteProductById } from "@/actions/productActions";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { FiExternalLink, FiEye } from "react-icons/fi";

const SoldTable = ({ products }) => {
  const [localProducts, setLocalProducts] = useState(products);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  if (!localProducts || localProducts.length === 0) {
    return <div>No products to display</div>;
  }

  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: "Are you sure you want to delete this product?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep it!",
      reverseButtons: true,
      customClass: {
        confirmButton: "btn-danger",
      },
    });
    if (result.isConfirmed) {
      try {
        setLoading(true);
        const response = await deleteProductById(productId);
        setLoading(false);
        if (response.status === 200) {
          toast.success("Product deleted successfully");
          setLocalProducts((prev) =>
            prev.filter((pre) => pre._id !== productId),
          );
        } else {
          toast.error(response.error);
        }
      } catch (error) {
        toast.error("Error while deleting the product");
      }
    }
  };

  const downloadCSV = () => {
    if (!localProducts || localProducts.length === 0) return;

    const headers = [
      "SKU",
      "Product Name",
      "Price",
      "Sold On",
      "Consignor Name",
      "Consignor Email",
      "Customer Name",
      "Customer Email",
    ];
    const rows = localProducts.map((p) => [
      p.sku,
      `"${p.title}"`,
      p.price,
      p.soldVia === "shopify" ? "Shopify" : "REE",
      p.consignorName || "Store Owner",
      p.consignorEmail || "Store Owner",
      p.orderDetails?.customerName || "",
      p.orderDetails?.customerEmail || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sold_products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Items Sold</h1>
        <Button onPress={downloadCSV} className="success-btn">
          Download CSV
        </Button>
      </div>
      <Table aria-label="Sold Products Table">
        <TableHeader>
          <TableColumn>SKU</TableColumn>
          <TableColumn>Product Name</TableColumn>
          <TableColumn>Price</TableColumn>
          <TableColumn>Sold On</TableColumn>
          <TableColumn>Consignor Name</TableColumn>
          <TableColumn>Consignor Email</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {localProducts.map((product) => (
            <TableRow key={product._id}>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.title}</TableCell>
              <TableCell>{product.price}</TableCell>
              <TableCell>
                <span
                  className={`px-3 py-1 rounded-full text-md font-semibold ${
                    product.soldVia === "shopify"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {product.soldVia === "shopify" ? "Shopify" : "REE"}
                </span>
              </TableCell>
              <TableCell>{product.consignorName || "Store Owner"}</TableCell>
              <TableCell>{product.consignorEmail || "Store Owner"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    isDisabled={loading}
                    onPress={() => handleDelete(product._id)}
                    className="danger-btn"
                  >
                    Delete
                  </Button>
                  {product.soldVia === "shopify" && product.orderDetails && (
                    <button
                      onClick={() => setSelectedOrder(product)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-md font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FiEye size={14} />
                      View Details
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Customer Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
        size="lg"
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-2xl font-bold text-gray-900">
                Shopify Order Details
              </ModalHeader>
              <ModalBody>
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[12px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                      Product
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedOrder?.title}
                    </p>
                    <p className="text-base text-gray-500 mt-1">
                      SKU: {selectedOrder?.sku} &middot; {selectedOrder?.price}{" "}
                      DKK
                    </p>
                  </div>

                  {selectedOrder?.orderDetails?.customerName && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[12px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                        Customer
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedOrder.orderDetails.customerName}
                      </p>
                      {selectedOrder.orderDetails.customerEmail && (
                        <p className="text-base text-gray-500 mt-1">
                          {selectedOrder.orderDetails.customerEmail}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedOrder?.orderDetails?.fulfillmentMethod && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[12px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                          Fulfillment
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {selectedOrder.orderDetails.fulfillmentMethod ===
                          "shipping"
                            ? "Shipping"
                            : "Store Pickup"}
                        </p>
                      </div>
                    )}

                    {selectedOrder?.orderDetails?.totalPrice && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[12px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                          Order Total
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedOrder.orderDetails.totalPrice}{" "}
                          {selectedOrder.orderDetails.currency || "DKK"}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedOrder?.orderDetails?.shippingAddress && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-[12px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">
                        Shipping Address
                      </p>
                      <p className="text-base text-gray-900">
                        {[
                          selectedOrder.orderDetails.shippingAddress.address1,
                          selectedOrder.orderDetails.shippingAddress.address2,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-base text-gray-900">
                        {[
                          selectedOrder.orderDetails.shippingAddress.city,
                          selectedOrder.orderDetails.shippingAddress.province,
                          selectedOrder.orderDetails.shippingAddress.zip,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-base text-gray-900">
                        {selectedOrder.orderDetails.shippingAddress.country}
                      </p>
                    </div>
                  )}

                  {selectedOrder?.orderDetails?.shopifyOrderUrl && (
                    <a
                      href={selectedOrder.orderDetails.shopifyOrderUrl}
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
                <Button onPress={onClose} className="success-btn px-6">
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

export default SoldTable;
