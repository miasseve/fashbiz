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
import { GridIcon, ListIcon, ChevronLeft, ChevronRight } from "lucide-react";
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
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
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
      <div className="flex justify-end mb-4 lg:mt-5 mx-[15px] ">
        {userRole === "store" && (
          <Button
            onPress={onOpen}
            variant="ghost"
            className="font-semibold p-7 border border-[#06cb03] rounded-[4px] mr-[10px] border border-white text-black bg-white"
          >
            Info
            <FaCircleInfo className="ml-2" />
          </Button>
        )}
        <Button
          onPress={() => setIsGrid(!isGrid)}
          variant="ghost"
          className="font-semibold p-7 border border-[#06cb03] rounded-[4px] mr-[10px] border border-white text-black bg-white"
        >
          {isGrid ? <ListIcon size={20} /> : <GridIcon size={20} />}
          {isGrid ? "List View" : "Grid View"}
        </Button>
      </div>
      <div className="relative w-full mb-4">
        {/* Left Arrow */}
        <button
          onClick={() =>
            scrollRef.current.scrollBy({ left: -200, behavior: "smooth" })
          }
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full 
            ${showLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto no-scrollbar px-10"
          onScroll={checkScrollPosition}
        >
          <div className="flex gap-3 whitespace-nowrap py-2">
            {/* All Filter Button */}
            <button
              onClick={() => setSelectedFilter("All")}
              className={` font-semibold px-4 py-2 rounded-[4px] border transition-all duration-200
                ${
                  selectedFilter === "All"
                    ? "bg-black text-white border-red-700 border-black hover:bg-red-800"
                    : "bg-white text-black border-gray-300 hover:bg-gray-100"
                }
              `}
            >
              All
            </button>
            
            {filters.map((name, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFilter(name)}
                className={` font-semibold px-4 py-2 rounded-[4px] border transition-all duration-200
                  ${
                    selectedFilter === name
                      ? "bg-black text-white border-red-700 border-black hover:bg-red-800"
                      : "bg-white text-black border-gray-300 hover:bg-gray-100"
                  }
                `}
              >
                {name.toLowerCase().replace(/^./, (ch) => ch.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={() =>
            scrollRef.current.scrollBy({ left: 200, behavior: "smooth" })
          }
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full 
            ${showRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronRight size={18} />
        </button>
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