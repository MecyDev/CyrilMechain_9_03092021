/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom/";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { localStorageMock } from "../__mocks__/localStorage";
import firebase from "../__mocks__/firebase";

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
    describe("When I am on Bills Page", () => {
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
          const myBills = new Bills({
            document,
            onNavigate,
            firestore: null,
            localStorage: window.localStorage,
          });
          myBills.handleClickNewBill = jest.fn();
          screen
            .getByTestId("btn-new-bill")
            .addEventListener("click", myBills.handleClickNewBill);
          fireEvent.click(screen.getByTestId("btn-new-bill"));
          expect(myBills.handleClickNewBill).toBeCalled();
        });
      });

      describe("When I click on the eye icon", () => {
        it("Should open the modal", () => {
          document.body.innerHTML = BillsUI({ data: bills });
          const myBills = new Bills({
            document,
            onNavigate,
            firestore: null,
            localStorage: window.localStorage,
          });
          myBills.handleClickIconEye = jest.fn();
          screen
            .getAllByTestId("icon-eye")[0]
            .addEventListener("click", myBills.handleClickIconEye);
          fireEvent.click(screen.getAllByTestId("icon-eye")[0]);
          expect(myBills.handleClickIconEye).toBeCalled();
        });

        it("And should display attached image", () => {
          document.body.innerHTML = BillsUI({ data: bills });
          const myBills = new Bills({
            document,
            onNavigate,
            firestore: null,
            localStorage: window.localStorage,
          });

          const handleClickIconEye = jest.fn(myBills.handleClickIconEye);
          const eye = screen.getAllByTestId("icon-eye")[0];
          eye.addEventListener("click", handleClickIconEye);
          fireEvent.click(eye);
          expect(handleClickIconEye).toHaveBeenCalled();
          const modale = screen.getByTestId("modalFile");
          expect(modale).toBeTruthy();
        });
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
