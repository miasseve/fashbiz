import React from "react";
import { State } from "country-state-city";

const StoreList = ({ stores }) => {
  return (
    <div className="p-4">
      <ul className="rounded-lg p-4 grid gap-6 sm:grid-cols-2 grid-cols-1">
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
                className="bg-white flex-1 shadow-md py-4 px-4 flex gap-5 items-center lg:flex-row flex-col flex-wrap"
              >
                <div className="w-[130px] h-[130px] flex-shrink-0">
                  <img
                    src={store.profileImage?.url || `/images/default.jpg`}
                    alt={`${store.storename} Profile`}
                    className="w-full h-full rounded-full object-cover border"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <p className="italic">
                    <span className="font-semibold">Name:</span> {store.storename} ({store.email})
                  </p>
                  <p className="italic">
                    <span className="font-semibold">Phone Number:</span> {store.phoneNumber}
                  </p>
                  <p className="italic break-words">
                    <span className="font-semibold">Address:</span> {store.address}
                  </p>
                  <p className="italic">
                    <span className="font-semibold">City:</span> {store.city}
                  </p>
                  <p className="italic">
                    <span className="font-semibold">Zipcode:</span> {store.zipcode}
                  </p>
                  {state?.label && (
                    <p className="italic">
                      <span className="font-semibold">State:</span> {state?.label} ({store?.country})
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
