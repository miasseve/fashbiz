"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaBoxOpen } from "react-icons/fa";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import {
  GridIcon,
  ListIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import CollectProductItem from "./CollectProductItem";
import { FaCircleInfo } from "react-icons/fa6";

export default function GetCollectProduct({ products, filters, userRole }) {
  const [isGrid, setIsGrid] = useState(true);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // Selected filter - now defaults to "All"
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Scroll Logic
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    checkScrollPosition();
  }, [filters]);

  const checkScrollPosition = () => {
    const el = scrollRef.current;
    if (!el) return;

    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollWidth > el.clientWidth + el.scrollLeft);
  };

  const filteredProducts = useMemo(() => {
    if (!selectedFilter || selectedFilter === "All") return products;

    const filter = selectedFilter.trim().toLowerCase();

    return products.filter((p) => {
      const brand = p.brand?.trim().toLowerCase();
      const store = p?.userId?.storename?.trim().toLowerCase();

      return userRole === "store" ? brand === filter : store === filter;
    });
  }, [selectedFilter, products, userRole]);

  return (
    <div className="p-4">
      {/* ---------------- Info Modal ---------------- */}
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-pink-500 text-white p-2 rounded-full">
                    <FaBoxOpen size={20} />
                  </span>
                  <span className="text-2xl font-bold text-pink-600 ">
                    Welcome to ReeCollect
                  </span>
                </div>

                <p className="text-2xl text-gray-600 text-center font-bold">
                  Where you send Brands their products back
                </p>
              </ModalHeader>

              <ModalBody className="text-gray-700 space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-2xl text-pink-600">
                    How to prepare collect
                  </h3>
                </div>

                <div className="space-y-2">
                  <p className="font-medium">One Brand Per bag:</p>

                  <ul className="list-disc ml-5 space-y-1">
                    <li>Add the products</li>
                    <li>Add your name card with number of items collected</li>
                    <li>Write on the bag the brand's name</li>
                  </ul>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ---------------- Filter Bar with Arrows ---------------- */}
      {/* View Toggle Button */}

      <div className="sm:p-4 pb-8 rounded-2xl">
        {/* Top Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Category Dropdown */}
          <div className="relative w-[200px]">
            <select className="w-full px-5 py-3 rounded-2xl bg-white text-black font-semibold outline-none appearance-none cursor-pointer shadow-sm focus:ring-2 focus:ring-pink-300">
              <option>All Brands</option>
              {filters.map((name, idx) => (
                <option key={idx}>{name}</option>
              ))}
            </select>

            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
              <ChevronDown />
            </div>
          </div>

          {/* Info Button */}
          <div className="flex justify-center items-center sm:gap-8 gap-[5px]">
            {userRole === "store" && (
              <Button
                onPress={onOpen}
                className="p-8 bg-white rounded-xl shadow"
              >
                <FaCircleInfo size={20} />
              </Button>
            )}

            {/* Grid/List Toggle */}
            <Button
              onPress={() => setIsGrid(!isGrid)}
              className="p-8 bg-white rounded-xl shadow"
            >
              {isGrid ? <ListIcon size={20} /> : <GridIcon size={20} />}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* ---------------- Product List ---------------- */}
        <div
          className={`${
            isGrid
              ? "grid sm:grid-cols-3 grid-cols-1 px-[15px] gap-[15px] lg:p-[10px]"
              : ""
          }`}
        >
          {filteredProducts.map((product) => (
            <CollectProductItem
              key={product._id}
              product={product}
              isGrid={isGrid}
              userRole={userRole}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
