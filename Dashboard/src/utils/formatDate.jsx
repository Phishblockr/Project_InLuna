export function formatDate(dateString, hourType) {
    const date = new Date(dateString);

    if (isNaN(date)) {
        console.warn("Invalid date format:", dateString);
        return "Invalid Date";
    }

    if (hourType === "12hours"){
        hourType = true
    } else if (hourType === "24hours"){
        hourType = false
    }

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: hourType,
    });
}
