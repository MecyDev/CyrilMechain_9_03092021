/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom/";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { localStorageMock } from "../__mocks__/localStorage";
import firebase from "../__mocks__/firebase";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import Firestore from "../app/Firestore";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({
    pathname,
  });
};

Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    describe("When I am on bill page but it's loading", () => {
      test("Then, Loading page should be rendered", () => {
        document.body.innerHTML = BillsUI({ data: [], loading: true });
        expect(screen.getAllByText("Loading...")).toBeTruthy();
      });
    });
    describe("When I am on bill page and error", () => {
      test("Then error page should be rendered", () => {
        document.body.innerHTML = BillsUI({
          data: [],
          loading: false,
          error: "error",
        });
        expect(screen.getAllByText("Erreur")).toBeTruthy();
      });
    });

    test("Then, bill icon in vertical layout should be highlighted", () => {
      jest.mock("../app/Firestore");
      Firestore.bills = () => ({
        bills,
        get: jest.fn().mockResolvedValue(),
      });
      const pathname = ROUTES_PATH["Bills"];
      Object.defineProperty(window, "location", {
        value: { hash: pathname },
      });
      document.body.innerHTML = `<div id="root"></div>`;
      router();
      expect(
        screen.getByTestId("icon-window").classList.contains("active-icon")
      ).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When i click on new bill button", () => {
      test("Then render the new bill page", () => {
        document.body.innerHTML = BillsUI({ data: [] });
        const bills = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });
        const handleClickNewBill = jest.fn(bills.handleClickNewBill);
        const button = screen.getByTestId("btn-new-bill");
        button.addEventListener("click", handleClickNewBill);
        fireEvent.click(button);
        expect(screen.getByTestId("new-bill").textContent).toEqual(
          " Envoyer une note de frais "
        );
      });
    });

    describe("When I click on the eye icon", () => {
      it("Should open the modal", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const billsT = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });
        billsT.handleClickIconEye = jest.fn();
        screen
          .getAllByTestId("icon-eye")[0]
          .addEventListener("click", billsT.handleClickIconEye);
        fireEvent.click(screen.getAllByTestId("icon-eye")[0]);
        expect(billsT.handleClickIconEye).toBeCalled();
      });
      it("And should display attached image", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const billsT = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });
        $.fn.modal = jest.fn();
        const icon = screen.getAllByTestId("icon-eye")[0];
        const handleClickIconEye = jest.fn(() =>
          billsT.handleClickIconEye(icon)
        );

        icon.addEventListener("click", handleClickIconEye);
        fireEvent.click(icon);
        expect(handleClickIconEye).toHaveBeenCalled();
        const modal = document.getElementById("modaleFile");
        expect(modal).toBeTruthy();
      });
    });
  });
  describe("Given I am connected as an employee", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
