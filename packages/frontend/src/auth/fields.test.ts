import { describe, expect, it } from "vitest";
import {
  EMPTY_FORM,
  LOGIN_FIELDS,
  SIGNUP_STEPS,
  validateFields,
  type AuthForm
} from "./fields";

const form = (values: Partial<AuthForm>): AuthForm => ({
  ...EMPTY_FORM,
  ...values
});

describe("validateFields", () => {
  describe("student login", () => {
    const fields = LOGIN_FIELDS.student;

    it("asks for both fields when the form is empty", () => {
      expect(validateFields(fields, EMPTY_FORM)).toEqual({
        username: "Please enter your username.",
        password: "Please enter your password."
      });
    });

    it("treats a username of only spaces as empty", () => {
      const errors = validateFields(
        fields,
        form({ username: "   ", password: "x" })
      );

      expect(errors).toEqual({ username: "Please enter your username." });
    });

    it("returns no errors for a filled-in form", () => {
      expect(
        validateFields(fields, form({ username: "nova", password: "x" }))
      ).toEqual({});
    });
  });

  it("rejects a teacher login email without a domain", () => {
    const errors = validateFields(
      LOGIN_FIELDS.teacher,
      form({ email: "samira@school", password: "secret" })
    );

    expect(errors).toEqual({ email: "That doesn't look like an email." });
  });

  describe("student sign-up", () => {
    const [aboutYou, account] = SIGNUP_STEPS.student;

    it.each([
      ["too short", "K7MP2"],
      ["uses the letter O, which codes never contain", "K7MPOQ"],
      ["uses the digit 1, which codes never contain", "K7MP1Q"]
    ])("rejects a class code that is %s", (_, classCode) => {
      const errors = validateFields(
        aboutYou,
        form({ displayName: "Nova", classCode })
      );

      expect(errors).toEqual({
        classCode: "Class codes are 6 letters and numbers."
      });
    });

    it("accepts a valid class code and only checks this step's fields", () => {
      // Password is empty, but it belongs to the next step, so no error.
      expect(
        validateFields(
          aboutYou,
          form({ displayName: "Nova", classCode: "K7MP2Q" })
        )
      ).toEqual({});
    });

    it("needs a username without spaces and a password of 8+ characters", () => {
      expect(
        validateFields(
          account,
          form({ username: "nova sings", password: "1234567" })
        )
      ).toEqual({
        username: "Use 3–20 letters, numbers or _ (no spaces).",
        password: "Passwords need at least 8 characters."
      });
      expect(
        validateFields(
          account,
          form({ username: "nova_sings", password: "12345678" })
        )
      ).toEqual({});
    });
  });

  it("lets a parent leave the optional invite code empty but checks it if given", () => {
    const [aboutYou] = SIGNUP_STEPS.parent;

    expect(validateFields(aboutYou, form({ displayName: "Alex" }))).toEqual({});
    expect(
      validateFields(aboutYou, form({ displayName: "Alex", linkCode: "ABC" }))
    ).toEqual({ linkCode: "Invite codes are 8 letters and numbers." });
  });
});
