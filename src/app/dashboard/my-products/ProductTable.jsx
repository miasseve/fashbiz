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
    <div>
      {products.map((product) => (
        <div key={product._id} className="border bg-white p-7  mb-4 rounded-lg">
          <h1 className="mt-2 font-bold p-2">Store Owner Detail</h1>
          <div className="flex flex-col gap-2  mb-2">
            <span className="italic">
              Name -{" "}
              {product.products[0]?.userDetails?.firstname +
                " " +
                product.products[0]?.userDetails?.lastname}{" "}
              ({product.products[0]?.userDetails?.email})
            </span>

            {product.products[0]?.userDetails?.phoneNumber && (
              <span className="italic">
                Phone - {product.products[0]?.userDetails?.phoneNumber}
              </span>
            )}
          </div>
          <Table aria-label="Sold Products Table">
            <TableHeader>
              <TableColumn>SKU</TableColumn>
              <TableColumn>Product Name</TableColumn>
              <TableColumn>Price</TableColumn>
              <TableColumn>Status</TableColumn>
            </TableHeader>
            <TableBody>
              {product.products.map((product) => (
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
      ))}
    </div>
  );
};

export default ProductTable;
