"use client";
import React, { useState, useEffect } from "react";
import {storeBrandAmount}  from "@/actions/accountAction"; 
import { Button, Card, CardBody } from "@heroui/react";
import { toast } from "react-toastify";

const BrandForm = ({ amount }) => {
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);

  useEffect(() => {
    setSelectedAmount(amount); // initial amount coming from DB
  }, []);

  // Create an array [10, 20, 30, ..., 500]
  const amountOptions = Array.from({ length: 50 }, (_, i) => (i + 1) * 10);

  const handleChange = (e) => {
    setSelectedAmount(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedAmount) {
      toast.error("Please select an amount.");
      return;
    }

    setLoading(true);

    try {
      const response = await storeBrandAmount({ amount: selectedAmount }); 
      
      if (response.status === 200) {
        toast.success(response.message);
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error("An error occurred while saving the amount.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-12 border border-green-500">
      <CardBody>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-medium">
            Select Amount Brand Pays Per Product (DKK)
          </label>

          <div className="flex gap-3 items-center">
            <select
              onChange={handleChange}
              defaultValue={amount}
              className="!max-w-[40%] border border-gray-300 rounded px-3 py-2"
            >
              {amountOptions.map((amt) => (
                <option key={amt} value={amt}>
                  {amt} DKK
                </option>
              ))}
            </select>

            <Button isLoading={loading} type="submit" className="success-btn">
              Save
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
};

export default BrandForm;
