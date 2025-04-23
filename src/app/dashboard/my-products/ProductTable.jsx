"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";

const ProductTable = ({ products }) => {
  return (
    <div className="border bg-white p-7  mb-4 rounded-lg">
      <Table aria-label="Sold Products Table">
        <TableHeader>
          <TableColumn>SKU</TableColumn>
          <TableColumn>Product Name</TableColumn>
          <TableColumn>Price</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product._id}>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.title}</TableCell>
              <TableCell>${product.price}</TableCell>
              <TableCell
                className={`${
                  product.sold ? "text-green-600" : "text-red-600"
                } font-semibold`}
              >
                {product.sold ? "Sold" : "Not Sold"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductTable;
