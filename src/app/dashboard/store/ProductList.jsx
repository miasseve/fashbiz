"use client";
import React, { useState } from "react";
import ProductItem from "./ProductItem";
import { Button } from "@heroui/react";
import { GridIcon, ListIcon } from "lucide-react"; // Or any icons you like

const ProductList = ({ products }) => {
  const [isGrid, setIsGrid] = useState(true);

  return (
    <div className="w-full">
      {/* View Toggle Button */}
      <div className="flex justify-end mb-4 mt-5">
        <Button
          onPress={() => setIsGrid(!isGrid)}
          variant="ghost"
          className="font-semibold p-7"
        >
          {isGrid ? <ListIcon size={20} /> : <GridIcon size={20} />}
          {isGrid ? "List View" : "Grid View"}
        </Button>
      </div>

      {/* Product List */}
      <div
        className={`${
          isGrid ? "flex flex-wrap gap-[30px] " : ""
        }`}
      >
        {products.map((product) => (
          <ProductItem key={product._id} product={product} isGrid={isGrid} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
