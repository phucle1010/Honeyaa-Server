const matchModel = require('../../model/matchModel');

const handlePostInteract = (req, res) => {
    const LIKE = 1;
    const DISLIKE = 2;
    const SUPER_LIKE = 3;

    const person_id = req.body.person_id;
    const target_id = req.body.target_id;
    const interact_type = req.body.interact_type;

    switch (interact_type) {
        case LIKE:
            matchModel.postInteract(person_id, target_id, LIKE, res);
            break;
        case DISLIKE:
            matchModel.postInteract(person_id, target_id, DISLIKE, res);
            break;
        case SUPER_LIKE:
            matchModel.postInteract(person_id, target_id, SUPER_LIKE, res);
            break;
        default:
            break;
    }
};

module.exports = {
    handlePostInteract,
};
