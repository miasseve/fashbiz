import React from "react";
import { State } from "country-state-city";

const StoreList = ({ stores }) => {
  return (
    <div className="p-4">
      <ul className="rounded-lg p-4 grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {stores.length > 0 ? (
          stores.map((store) => {
            let state = {};
            if (store?.country) {
              const sOptions = State.getStatesOfCountry(store.country).map(
                (state) => ({
                  value: state.isoCode,
                  label: state.name,
                })
              );
              state = sOptions.find((s) => s.value === store.state);
            }
            return (
              <li
                key={store._id}
                className="border bg-white flex-1 shadow-md py-4 px-4 flex gap-5 items-center lg:flex-row flex-col flex-wrap"
              >
                <div className="w-[130px] h-[130px] flex-shrink-0">
                  <img
                    src={
                      store.profileImage?.url ||
                      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/images/default.jpg`
                    }
                    alt={`${store.storename} Profile`}
                    className="w-full h-full rounded-full object-cover border"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <p className="italic">
                    <strong>Name:</strong> {store.storename} ({store.email})
                  </p>
                  <p className="italic">
                    <strong>Phone Number:</strong> {store.phoneNumber}
                  </p>
                  <p className="italic break-words">
                    <strong>Address:</strong> {store.address}
                  </p>
                  <p className="italic">
                    <strong>City:</strong> {store.city}
                  </p>
                  <p className="italic">
                    <strong>Zipcode:</strong> {store.zipcode}
                  </p>
                  {state?.label && (
                    <p className="italic">
                      <strong>State:</strong> {state?.label} ({store?.country})
                    </p>
                  )}
                </div>
              </li>
            );
          })
        ) : (
          <p>No stores found.</p>
        )}
      </ul>
    </div>
  );
};

export default StoreList;
