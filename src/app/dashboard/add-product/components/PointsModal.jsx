"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
} from "@heroui/react";
import {
  getPointRuleForProduct,
  createPointsSchema,
  getPointRuleDisplayText,
} from "@/actions/validations";

const PointsModal = ({
  isOpen,
  onClose,
  pointsPreview,
  pointsLoading,
  availableRules,
  onConfirm,
}) => {
  // Get the current applicable rule
  const currentRule = getPointRuleForProduct(
    pointsPreview?.category,
    pointsPreview?.fashionType,
    availableRules
  );

  // Create validation schema based on the rule
  const validationSchema = createPointsSchema(currentRule);

  // Initialize form with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm({
    mode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues: {
      points: pointsPreview?.points || 0,
    },
  });

  // Update form when pointsPreview changes
  useEffect(() => {
    if (isOpen && pointsPreview?.points !== undefined) {
      reset({
        points: pointsPreview.points,
      });
    }
  }, [isOpen, pointsPreview, reset]);

  // Handle form submission
  const onSubmit = (data) => {
    onConfirm(data.points);
    reset();
  };

  // Handle modal close
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      onClose={handleClose}
      placement="center"
      size="2xl"
      className="rounded-xl mx-6 sm:mx-8"
      isDismissable={false}
    >
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader className="flex justify-center items-center text-2xl font-semibold">
            Predicted Product Points
          </ModalHeader>

          <ModalBody className="space-y-3">
            {pointsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner size="lg" label="Analyzing product..." />
              </div>
            ) : (
              <>
                {/* Category and Brand Type Info */}
                <p>
                  <strong>Category:</strong> {pointsPreview?.category}
                </p>
                <p>
                  <strong>Brand Type:</strong> {pointsPreview?.fashionType}
                </p>

                {pointsPreview?.reason && (
                  <div className="bg-default-100 p-3 rounded-lg">
                    <p className="text-md">
                      <strong>AI Reasoning:</strong>
                    </p>
                    <p className="text-md text-default-600 mt-1">
                      {pointsPreview.reason}
                    </p>
                  </div>
                )}

                {/* Point Rule Display */}
                {currentRule && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                          Point Rule
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {getPointRuleDisplayText(currentRule)}
                        </p>
                        {currentRule.requiresQualityCheck && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 italic">
                            * Requires quality check
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Points Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="points-input"
                    className="block text-md font-semibold"
                  >
                    Assign Points:
                  </label>
                  <Input
                    {...register("points", { valueAsNumber: true })}
                    id="points-input"
                    type="number"
                    size="lg"
                    placeholder="Enter points"
                    className="text-2xl font-bold"
                    isInvalid={!!errors.points}
                  />
                  {errors.points && (
                    <p className="text-sm text-red-600 mt-2">
                      {errors.points.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </ModalBody>

          <ModalFooter className="flex justify-between">
            <Button variant="light" onPress={handleClose} type="button">
              Cancel
            </Button>

            <Button
              type="submit"
              className="success-btn"
              isDisabled={pointsLoading || !isValid}
            >
              Confirm & Continue
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default PointsModal;
