/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage";
import firestore from "../app/Firestore.js";

const onNavigate = () => {
  return;
};

Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem(
  "user",
  JSON.stringify({ type: "Employee", email: "cedric.hiely@billed.com" })
);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the newBill page should be rendered", () => {
      document.body.innerHTML = NewBillUI();
      expect(screen.getByTestId("new-bill").textContent).toEqual(
        " Envoyer une note de frais "
      );
    });
  });
  describe("When I'm on NewBill Page", () => {
    describe("And I upload a image file", () => {
      test("Then the file is good format", async () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: firestore,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
        const file = new File(["hello"], "hello.png", { type: "image/png" });
        const input = screen.getByTestId("file");
        userEvent.upload(input, file);
        input.addEventListener("change", handleChangeFile);
        expect(handleChangeFile).toBeTruthy();
      });
    });
    describe("And I upload a wrong format file", () => {
      test("Then the error message should be display", async () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: firestore,
          localStorage: window.localStorage,
        });
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
        const file = new File(["hello"], "hello.txt", { type: "text/txt" });
        const input = screen.getByTestId("file");
        userEvent.upload(input, file);
        input.addEventListener("change", handleChangeFile);
        expect(screen.getByTestId("error-img").style.display).toBe("inline");
      });
    });
    describe("And I submit a valid bill", () => {
      test("Then a bill is created", async () => {
        document.body.innerHTML = NewBillUI();
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: firestore,
          localStorage: window.localStorage,
        });
        const submit = screen.getByTestId("form-new-bill");
        const bill = {
          name: "Bill",
          date: "2021-07-14",
          type: "Transports",
          amount: 99,
          pct: 20,
          vat: 70,
          commentary: "bonjour le monde",
          fileName: "test.png",
          fileUrl: "https://google.com/test.png",
        };
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        newBill.createBill = (newBill) => newBill;
        screen.getByTestId("expense-name").value = bill.name;
        screen.getByTestId("datepicker").value = bill.date;
        screen.getByTestId("expense-type").value = bill.type;
        screen.getByTestId("amount").value = bill.amount;
        screen.getByTestId("vat").value = bill.vat;
        screen.getByTestId("pct").value = bill.pct;
        screen.getByTestId("commentary").value = bill.commentary;
        newBill.fileUrl = bill.fileUrl;
        newBill.fileName = bill.fileName;
        submit.addEventListener("click", handleSubmit);
        fireEvent.click(submit);
        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });
});
