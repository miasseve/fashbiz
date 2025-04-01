"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button, Input, Spinner } from "@heroui/react";
import { countries } from "countries-list";
import { State } from "country-state-city";
import { Select, SelectItem } from "@heroui/react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";

const DeliveryDetials = () => {
  const profileSchema = Yup.object({
    firstname: Yup.string().trim().required("First name is required"),
    lastname: Yup.string().trim().required("Last name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    phoneNumber: Yup.string()
      .required("Phone number is required")
      .test("is-valid-phone", "Phone number is not valid", (value) => {
        if (!value) return false;
        return isValidPhoneNumber(value);
      }),
    address: Yup.string().trim().required("Address is required"),
    city: Yup.string().trim().required("City is required"),
    zipcode: Yup.string()
      .matches(/^\d{5}(-\d{4})?$/, "Invalid zipcode format")
      .required("Zipcode is required"),
    state: Yup.string().trim().required("State is required"),
    country: Yup.string().trim().required("Country is required"),
  });
  const countryOptions =[];
  const {
    register,
    control,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstname:  "",
      lastname: "",
      email: "",
      phoneNumber:  "",
      address: "",
      city: "",
      zipcode:  "",
      state: "",
      country:  "",
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
    const [stateOptions, setStateOptions] = useState( []);
  const onSubmit = async (data) => {
    console.log(data);
  };
  const handleStateChange = (e) => {
    clearErrors("state");
    setValue("state", e.target.value);
  };
    const handleCountryChange = (e) => {
    console.log('hello')
    };
  return (
    <div>
      <p>Delivery Detials</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              First Name
            </label>
            <Input {...register("firstname")} className="mt-2 w-full" />
            {errors.firstname && (
              <span className="text-red-500">{errors.firstname.message}</span>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Last Name
            </label>
            <Input {...register("lastname")} className="mt-2 w-full" />
            {errors.lastname && (
              <span className="text-red-500">{errors.lastname.message}</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <Controller
              name="phoneNumber"
              control={control}
              defaultValue={ ""}
              render={({ field }) => (
                <PhoneInput
                  {...field}
                  international
                  defaultCountry="US"
                  className="mt-2 w-full"
                  placeholder="Enter phone number"
                />
              )}
            />
            {errors.phoneNumber && (
              <span className="text-red-500 ">
                {errors.phoneNumber.message}
              </span>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <Input
              type="email"
              disabled
              defaultValue={"mailto:user@example.com"}
              className="mt-2 w-full"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Address
          </label>
          <Input type="text" {...register("address")} className="mt-2 w-full" />
          {errors.address && (
            <span className="text-red-500">{errors.address.message}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              City
            </label>
            <Input type="text" {...register("city")} />
            {errors.city && (
              <span className="text-red-500">{errors.city.message}</span>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Zipcode
            </label>
            <Input type="text" {...register("zipcode")} />
            {errors.zipcode && (
              <span className="text-red-500">{errors.zipcode.message}</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              State
            </label>
            <Select
              {...register("state")}
              className="max-w-xs"
              placeholder="Select state"
              onChange={handleStateChange}
            >
              {stateOptions.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </Select>
            {errors.state && (
              <span className="text-red-500">{errors.state.message}</span>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Country
            </label>
            <Select
              {...register("country")}
              className="max-w-xs"
              placeholder="Select country"
              onChange={handleCountryChange}
            >
              {countryOptions.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </Select>
            {errors.country && (
              <span className="text-red-500">{errors.country.message}</span>
            )}
          </div>
        </div>
        <div className="flex justify-center">
          <Button
            isLoading={isSubmitting}
            type="submit"
            color="success"
            className="text-lg px-6 py-3 text-white rounded-lg hover:bg-green-500"
          >
            Save
          </Button>
        </div>
        {error && (
          <span className="text-red-500 left-0 text-[12px]">{error}</span>
        )}
      </form>
    </div>
  );
};

export default DeliveryDetials;
