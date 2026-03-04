export const calculateFare = (distanceKm, rideType) => {
    const baseFare = 30;
    const perKm = rideType === "premium" ? 18 : 12;
    return baseFare + distanceKm * perKm;
  };