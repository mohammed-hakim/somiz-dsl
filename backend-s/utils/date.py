
def format_date(d, fmt="%Y-%m-%d"):
    if not d: return None
    if isinstance(d, str):
        return d[:10] if fmt == "%Y-%m-%d" else d[:16]
    return d.strftime(fmt)