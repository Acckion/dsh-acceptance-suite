def normalize(text: str) -> str:
    return " ".join(text.split()).lower()


def initials(text: str) -> str:
    parts = normalize(text).split()
    return "".join(part[0] for part in parts if part)
