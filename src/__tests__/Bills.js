/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { localStorageMock } from "../__mocks__/localStorage";
import firebase from "../__mocks__/firebase";
import router from "../app/Router.js";

const onNavigate = () => {
  return;
};

Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem(
  "user",
  JSON.stringify({ type: "Employee", email: "cedric.hiely@billed.com" })
);

jest.mock("../containers/Bills.js", () => {
  return jest.fn().mockImplementation(function () {
    return {
      getBills: function () {
        return [];
      },
    };
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on bill page but it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });

  describe("When I am on bill page and error", () => {
    test("Then, error page should be rendered", () => {
      document.body.innerHTML = BillsUI({ error: "oops an error" });
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      expect(screen.getByTestId("icon-window")).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
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
      test("Then handleClickNewBill should be called", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const sampleBills = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });
        sampleBills.handleClickNewBill = jest.fn();
        screen
          .getByTestId("btn-new-bill")
          .addEventListener("click", sampleBills.handleClickNewBill);
        fireEvent.click(screen.getByTestId("btn-new-bill"));
        expect(sampleBills.handleClickNewBill).toBeCalled();
      });
    });
    describe("When I click on the eye icon", () => {
      test("Then modal should open", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        const sampleBills = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });
        sampleBills.handleClickIconEye = jest.fn();
        screen
          .getAllByTestId("icon-eye")[0]
          .addEventListener("click", sampleBills.handleClickIconEye);
        fireEvent.click(screen.getAllByTestId("icon-eye")[0]);
        expect(sampleBills.handleClickIconEye).toBeCalled();
      });
    });
  });
});
