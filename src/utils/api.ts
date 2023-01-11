import axios from "axios";
import { User } from "../components/MTable";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL; //"https://crudcrud.com/api/2289275c7339463c8105cd348dbd29fd"
if (!apiBaseUrl) {
  throw new Error("Add your api url to .env file");
}

export const fetchUsers = async () => {
  const apiRes = await axios.get(apiBaseUrl + "/users");

  if (!apiRes.data) {
    throw new Error("API response error");
  }

  return apiRes.data;
};

export const createUser = ({ firstName, lastName }: User) => {
  return axios.post(apiBaseUrl + "/users/", { firstName, lastName });
};

export const updateUser = ({ _id, firstName, lastName }: User) => {
  return axios.put(apiBaseUrl + "/users/" + _id, { firstName, lastName });
};

export const deleteUser = (_id: string) => {
  return axios.delete(apiBaseUrl + "/users/" + _id);
};
