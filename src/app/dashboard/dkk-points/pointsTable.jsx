"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";

function PointsTable() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPointsRules();
  }, []);

  const fetchPointsRules = async () => {
    try {
      const res = await fetch("/api/dkkpointsrule");
      const data = await res.json();
      setRules(data || []);
    } catch (error) {
      console.error("Error fetching point rules:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading point rules...</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table isStriped>
        <TableHeader>
          <TableColumn>Category</TableColumn>
          <TableColumn>Brand Type</TableColumn>
          <TableColumn>Min Points</TableColumn>
          <TableColumn>Max Points</TableColumn>
          <TableColumn>Fixed Points</TableColumn>
          <TableColumn>QC Required</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>

        <TableBody emptyContent="No point rules found">
          {rules.map((rule) => (
            <TableRow key={rule._id}>
              <TableCell>{rule.category}</TableCell>
              <TableCell>{rule.brandType}</TableCell>
              <TableCell>{rule.minPoints ?? "-"}</TableCell>
              <TableCell>{rule.maxPoints ?? "-"}</TableCell>
              <TableCell>{rule.fixedPoints ?? "-"}</TableCell>
              <TableCell>
                {rule.requiresQualityCheck ? "Yes" : "No"}
              </TableCell>
              <TableCell>
                {rule.isActive ? "Active" : "Inactive"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default PointsTable;
