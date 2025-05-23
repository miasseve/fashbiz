"use client";
import React, { useState, useEffect } from "react";
import { storePercentage } from "@/actions/accountAction";
import {  Button, Card, CardBody } from "@heroui/react";
import { toast } from "react-toastify";
const PercentForm = ({ percentage }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPercent, setSelectedPercent] = useState(null);

  useEffect(() => {
    setSelectedPercent(percentage);
  }, []);

  const percentOptions = [
    { label: "10%", value: "10" },
    { label: "20%", value: "20" },
    { label: "30%", value: "30" },
    { label: "40%", value: "40" },
    { label: "50%", value: "50" },
    { label: "60%", value: "60" },
  ];

  const handleChange = (e) => {
    setSelectedPercent(e.target.value); // Update the selected percentage state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedPercent === null) {
      toast.error("Please select a percentage.");
      return;
    }

    setLoading(true); // Show loading state

    try {
      const response = await storePercentage({ percentage: selectedPercent });
      if (response.status === 200) {
        toast.success(response.message);
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error("An error occurred while updating the percentage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-12 border border-green-500">
      <CardBody>
        <form onSubmit={handleSubmit}>
          <label>Select Percentage on Products</label>
          <div className="flex  gap-3 items-center">
            <select
              onChange={handleChange}
              className="!max-w-[40%] border border-gray-300 rounded px-3 py-2"
              defaultValue={`${percentage}`}
            >
              {percentOptions.map((percent) => (
                <option key={percent.value} value={percent.value}>
                  {percent.label}
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

export default PercentForm;
