import * as faker from 'faker/locale/en_US';

import {
  mockAgencyWithStaff,
  mockOneFullAgencyStaff,
} from '@hbx/utils/testing';

describe('Agency Staff Detail Page', () => {
  const agencyProfileId = faker.random.uuid();
  const { agency, agencyStaff, primaryAgent } = mockAgencyWithStaff(
    agencyProfileId
  );

  const [primAgent, agent] = agencyStaff;

  const agentWithDetail = mockOneFullAgencyStaff(agent);
  const { first_name, last_name, _id } = agentWithDetail;

  beforeEach(() => {
    cy.server();
    cy.route('**/agencies', [agency]).as('agencies');
    cy.route('**/agencies/agency_staff', agencyStaff).as('agencyStaff');
    cy.route('**/agencies/primary_agency_staff', [primaryAgent]).as(
      'primaryAgents'
    );

    cy.route(`**/agencies/agency_staff/${_id}`, agentWithDetail).as(
      'agentDetail'
    );
    cy.visit(`/agencies/agency-staff/${_id}`);
  });

  it('display a detailed view of the agent', () => {
    cy.wait('@agencies');
    cy.wait('@agencyStaff');
    cy.wait('@primaryAgents');
    cy.wait('@agentDetail');

    cy.contains(`${first_name} ${last_name}`);
  });

  it('should allow for termination of staff role', () => {
    cy.route('post', '**/terminate/**', {}).as('terminateRole');

    cy.get(
      'hbx-agency-association:first .state-and-action > .hbx-button'
    ).click();

    cy.get(
      'hbx-agency-association:first .state-and-action > .hbx-button.terminating'
    ).click();

    cy.wait('@terminateRole');

    cy.get('hbx-agency-association:first .association-state').contains(
      'terminated'
    );

    cy.get('.change-history .status-changes').contains('terminated');
  });

  it('should revert change on api fail', () => {
    cy.route({
      method: 'post',
      url: '**/terminate/**',
      response: {},
      status: 500,
    }).as('terminateRole');

    cy.get(
      'hbx-agency-association:first .state-and-action > .hbx-button'
    ).click();

    cy.get(
      'hbx-agency-association:first .state-and-action > .hbx-button.terminating'
    ).click();

    cy.wait('@terminateRole');

    cy.get(
      '.change-history .status-changes .association-state.terminated'
    ).should('not.exist');
  });

  it('should allow for changing demographic information', () => {
    cy.route('PATCH', `**/${_id}`, { status: 'success' }).as(
      'changeDemographics'
    );

    const newBirthDate = {
      year: '1980',
      month: '10',
      day: '13',
    };

    cy.get('#edit-demographics-button').click();
    cy.get('#save-demographics-button').should('be.disabled');
    cy.get('#first-name')
      .clear()
      .should('have.class', 'ng-invalid')
      .type('Ted');
    cy.get('#last-name')
      .clear()
      .should('have.class', 'ng-invalid')
      .type('Crisp');
    cy.get('#dob-month')
      .clear()
      .should('have.class', 'ng-invalid')
      .type('13')
      .should('have.class', 'ng-invalid')
      .clear()
      .type(newBirthDate.month);
    cy.get('#dob-day')
      .clear()
      .should('have.class', 'ng-invalid')
      .type('35')
      .should('have.class', 'ng-invalid')
      .clear()
      .type(newBirthDate.day);
    cy.get('#dob-year')
      .clear()
      .should('have.class', 'ng-invalid')
      .type('2022')
      .should('have.class', 'ng-invalid')
      .clear()
      .type(newBirthDate.year);
    cy.get('#save-demographics-button').click();
    cy.wait('@changeDemographics');
    cy.get('#staff-name-heading').contains('Ted Crisp');
    cy.get('#staff-date-of-birth').contains('Oct 13, 1980');
  });

  it('should revert demographics change when api fails', () => {
    cy.route({
      method: 'PATCH',
      url: `**/${_id}`,
      response: { status: 'success' },
      status: 409,
    }).as('changeDemographics');

    cy.get('#edit-demographics-button').click();
    cy.get('#first-name')
      .clear()
      .should('have.class', 'ng-invalid')
      .type('Ted');
    cy.get('#save-demographics-button').click();
    cy.wait('@changeDemographics');
    cy.get('#staff-name-heading').contains(`${first_name} ${last_name}`);
  });

  it('should allow for changing email information', () => {
    cy.route('PATCH', `**/${_id}/email`, { status: 'success' }).as(
      'changeEmail'
    );

    cy.get('#edit-email-button').click();
    cy.get('#email-input-1').clear().type('Ted');
    cy.get('#save-email-button').should('be.disabled');
    cy.get('#email-group-1').should('have.class', 'ng-invalid');

    cy.get('#email-input-1').clear().type('ted@example.com');
    cy.get('#save-email-button').should('not.be.disabled').click();
    cy.wait('@changeEmail');

    cy.get('#email-display-1').contains('ted@example.com');
  });

  it('should revert email change when api fails', () => {
    const [firstEmail] = agentWithDetail.agent_emails;

    cy.route({
      method: 'PATCH',
      url: `**/${_id}/email`,
      response: { status: 'success' },
      status: 400,
    }).as('changeEmail');

    cy.get('#edit-email-button').click();
    cy.get('#email-input-1').clear().type('ted@example.com');
    cy.get('#save-email-button').should('not.be.disabled').click();
    cy.wait('@changeEmail');

    cy.get('#email-display-1').contains(firstEmail.address);
  });
});
