'use client';
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@heroui/table";
import { Button } from '@heroui/button';
import { deleteProductById } from '@/actions/productActions';
import { toast } from 'react-toastify';

const SoldTable = ({ products }) => {
  const [localProducts, setLocalProducts] = useState(products);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]); // This will update the state when products prop changes

  if (!localProducts || localProducts.length === 0) {
    return <div>No products to display</div>;
  }

  

  return (
    <div>
      <Table aria-label="Sold Products Table">
        <TableHeader>
          <TableColumn>SKU</TableColumn>
          <TableColumn>Product Name</TableColumn>
          <TableColumn>Price</TableColumn>
        </TableHeader>
        <TableBody>
          {localProducts.map((product) => (
            <TableRow key={product._id}>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.title}</TableCell>
              <TableCell>{product.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SoldTable;
