export const getInteraction = async (req, res) => {
    const uid = req.params.uid;
    res.render('interaction', { uid });
};

export const postInteractionLogin = async (req, res, next, provider) => {
    try {
        const result = {
            login: { accountId: 'user1' },
            consent: {}
        };
        await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
    } catch (err) {
        next(err);
    }
};