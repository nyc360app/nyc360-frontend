namespace NYC360.Domain.Enums.Housing;

public enum NearbyTransportation
{
    // Subway Lines
    Subway_123 = 1 << 0,
    Subway_456 = 1 << 1,
    Subway_7 = 1 << 2,
    Subway_ACE = 1 << 3,
    Subway_BDFM = 1 << 4,
    Subway_G = 1 << 5,
    Subway_JZ = 1 << 6,
    Subway_L = 1 << 7,
    Subway_NQRW = 1 << 8,
    Subway_S = 1 << 9,

    // Bus Access
    Bus_Local = 1 << 10,
    Bus_Limited = 1 << 11,
    Bus_SBS = 1 << 12,
    Bus_24Hour = 1 << 13,

    // Regional Rail
    Rail_LIRR = 1 << 14,
    Rail_MetroNorth = 1 << 15,
    Rail_PATH = 1 << 16,

    // Ferry
    Ferry_NYC = 1 << 17,
    Ferry_StatenIsland = 1 << 18,

    // Bike & Micromobility
    Bike_CitiBike = 1 << 19,
    Bike_ProtectedLanes = 1 << 20,
    Bike_ScooterFriendly = 1 << 21,

    // Car Access
    Car_HighwayAccess = 1 << 22,
    Car_StreetParking = 1 << 23,
    Car_GarageParking = 1 << 24
}