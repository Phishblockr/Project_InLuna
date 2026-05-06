export const convertTypes = (fieldsToConvert) => (req, res, next) => {
    fieldsToConvert.forEach(field => {
        if (req.body[field] === "true") req.body[field] = true;
        if (req.body[field] === "false") req.body[field] = false;
    });
    next();
};
