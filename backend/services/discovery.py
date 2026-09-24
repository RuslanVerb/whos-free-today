from math import asin, cos, radians, sin, sqrt


EARTH_RADIUS_KM = 6371.0088


def calculate_distance_km(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    lat_1 = radians(latitude_1)
    lon_1 = radians(longitude_1)

    lat_2 = radians(latitude_2)
    lon_2 = radians(longitude_2)

    delta_lat = lat_2 - lat_1
    delta_lon = lon_2 - lon_1

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat_1)
        * cos(lat_2)
        * sin(delta_lon / 2) ** 2
    )

    c = 2 * asin(
        sqrt(a)
    )

    distance = (
        EARTH_RADIUS_KM * c
    )

    return distance
