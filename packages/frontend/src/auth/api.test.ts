import { describe, expect, it } from "vitest";
import { ApiError } from "../api/client";
import { loginBody, mapAuthError } from "./api";
import { EMPTY_FORM } from "./fields";

describe("mapAuthError", () => {
  it("puts a wrong-login error on the password field", () => {
    const error = new ApiError(
      401,
      "invalid_login",
      "Wrong username/email or password"
    );

    expect(mapAuthError("student", error)).toEqual({
      password: "Wrong username/email or password."
    });
  });

  it("shows 'account exists' on the username for students and on the email for others", () => {
    const error = new ApiError(409, "account_exists", "taken");

    expect(mapAuthError("student", error)).toEqual({
      username: "That account already exists. Try logging in."
    });
    expect(mapAuthError("teacher", error)).toEqual({
      email: "That account already exists. Try logging in."
    });
  });

  it("puts a bad class code on the class code field", () => {
    const error = new ApiError(400, "invalid_class_code", "nope");

    expect(mapAuthError("student", error)).toEqual({
      classCode: "We couldn't find that class code."
    });
  });

  it.each([
    [
      "an unknown 400",
      new ApiError(400, "weak_password", "x"),
      "Please check the required details and try again."
    ],
    [
      "a server error",
      new ApiError(500, "server_error", "x"),
      "Something went wrong. Please try again."
    ],
    [
      "a non-API error",
      new TypeError("Failed to fetch"),
      "Something went wrong. Please try again."
    ]
  ])("shows a form-level message for %s", (_, error, message) => {
    expect(mapAuthError("parent", error)).toEqual({ form: message });
  });
});

describe("loginBody", () => {
  it("sends a student's username and a teacher's email as the identifier", () => {
    const form = {
      ...EMPTY_FORM,
      username: "  nova_sings ",
      email: " samira@school.test ",
      password: " keep spaces "
    };

    expect(loginBody("student", form)).toEqual({
      identifier: "nova_sings",
      password: " keep spaces "
    });
    expect(loginBody("teacher", form)).toEqual({
      identifier: "samira@school.test",
      password: " keep spaces "
    });
  });
});
