export const combineDateAndTime = (dateObj, timeslot) => {
    const [time, period] = timeslot.split (" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period.toUpperCase() === "PM" && hours !== 12) {
        hours += 12;
    } else if (period.toUpperCase() == "AM" && hours === 12) {
        hours = 0;
    }

    const combinedDate = new Date(dateObj);
    combinedDate.setHours(hours,minutes, 0,0);
    
    return combinedDate;
}