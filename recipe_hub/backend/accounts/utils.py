def determine_user_role(email: str) -> str:
    email = (email or "").lower()

    if email.endswith("@recipehub.com"):
        return "admin"
    elif email.endswith("@company.com"):
        return "company"
    else:
        return "user"

