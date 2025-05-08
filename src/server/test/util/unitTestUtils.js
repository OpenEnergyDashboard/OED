const { chai, mocha, expect, app, testDB, testUser, recreateDB } = require('../common');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

function applyMutation(base, mutation) {
    if (!mutation) return base;

    const mutated = { ...base };

    switch (mutation.type) {
        case 'remove':
            delete mutated[mutation.field];
            break;
        case 'change':
            mutated[mutation.field] = mutation.value;
            break;
        case 'custom':
            return mutation.body;
        default:
            throw new Error(`Unknown mutation type: ${mutation.type}`);
    }

    return mutated;
}


function generateUnitValidationTests({ app, method = 'post', endpoint, Unit, getId, options = {}, cases }) {
    cases.forEach(({ name, expectedStatus, mutation }) => {
        mocha.it(name, async () => {
            const id = await getId();
            const basePayload = getBaseValidUnit(id, Unit, options);
            const payload = applyMutation(basePayload, mutation);
            const res = await require('chai').request(app)[method](endpoint).send(payload);
            expect(res).to.have.status(expectedStatus);
        });
    });
}

function getBaseValidUnit(id, Unit, options = {}) {
    const payload = {
        name: 'Water Flow Unit',
        identifier: 'energy_unit',
        unitRepresent: Unit.unitRepresentType.FLOW,
        secInRate: 60,
        typeOfUnit: Unit.unitType.UNIT,
        suffix: 'L/s',
        displayable: Unit.displayableType.ALL,
        preferredDisplay: true,
        note: 'Used to measure water flow',
        minVal: 1,
        maxVal: 100,
        disableChecks: Unit.disableChecksType.REJECT_BAD
    };

    if (!options.skipId && id !== undefined) {
        payload.id = id;
    }

    return payload;
}



module.exports = {
    generateUnitValidationTests,
    getBaseValidUnit,
};
