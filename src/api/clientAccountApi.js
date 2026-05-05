import axiosClient from "./axiosClient";

const clientAccountApi = {
  async me() {
    const res = await axiosClient.get("/client/Account/me");
    return res?.data || null;
  },
};

export default clientAccountApi;

