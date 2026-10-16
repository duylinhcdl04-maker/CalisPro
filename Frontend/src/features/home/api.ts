import { homeService } from "../../services/mock/homeService";

export const homeApi = {
  getHome: (userName: string) => homeService.getHome(userName),
};
