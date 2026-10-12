"""Schulfreie Tage im Saarland (Ferien, Feiertage, bewegliche Ferientage) – für die Serien in den Apps.
Quelle: kalenderpedia.de (ohne Gewähr). Pro Schuljahr ergänzen. Format: (von, bis) einschließlich, ISO-Datum.
"""
FREI = [
    ("2026-10-05", "2026-10-11", "Herbstferien (ab 12.10. zählt jeder Wochentag – Wunsch Mr. Alex: App schon in den Ferien nutzbar)"),
    ("2026-12-21", "2027-01-03", "Weihnachtsferien"),
    ("2027-02-08", "2027-02-12", "Winterferien (Fastnacht)"),
    ("2027-03-26", "2027-03-26", "Karfreitag"),
    ("2027-03-29", "2027-04-09", "Ostermontag und Osterferien"),
    ("2027-05-06", "2027-05-07", "Christi Himmelfahrt und beweglicher Ferientag"),
    ("2027-05-17", "2027-05-17", "Pfingstmontag"),
    ("2027-05-27", "2027-05-28", "Fronleichnam und beweglicher Ferientag"),
    ("2027-06-28", "2027-08-06", "Sommerferien"),
    ("2027-10-04", "2027-10-15", "Herbstferien"),
    ("2027-12-20", "2027-12-31", "Weihnachtsferien"),
]


def als_daten():
    return [{"von": v, "bis": b, "name": n} for v, b, n in FREI]
