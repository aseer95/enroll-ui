import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, tap, filter } from 'rxjs/operators';

import { AgencyStaffDetailVM, EmailVM } from '@hbx/admin/shared/view-models';
import {
  RoleChangeRequest,
  DemographicsUpdate,
  AgentEmail,
  EmailKind,
} from '@hbx/api-interfaces';
import { validDate } from '@hbx/utils/form-validators';

import { AgencyStaffFacade } from '../state/agency-staff/agency-staff.facade';
import * as AgencyStaffActions from '../state/agency-staff/agency-staff.actions';

interface DetailVM {
  agent: AgencyStaffDetailVM;
  loaded: boolean;
}

@Component({
  templateUrl: './agency-staff-detail.component.html',
  styleUrls: ['./agency-staff-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgencyStaffDetailComponent {
  editingDemographics = false;
  editingContactInfo = false;

  formSubscription: Subscription;

  demographicsForm: FormGroup;
  contactForm: FormGroup;

  agencyStaff: AgencyStaffDetailVM;

  detailVM$: Observable<DetailVM> = combineLatest([
    this.agencyStaffFacade.loaded$,
    this.agencyStaffFacade.selectedAgencyStaff$,
  ]).pipe(
    map(([loaded, agent]: [boolean, AgencyStaffDetailVM]) => ({
      loaded,
      agent,
    })),
    filter(detailVM => detailVM.agent !== null),
    tap((detailVM: DetailVM) => {
      this.agencyStaff = detailVM.agent;

      const { firstName, lastName, dob, email } = detailVM.agent;

      this.demographicsForm = this.fb.group({
        firstName: [firstName, [Validators.required]],
        lastName: [lastName, [Validators.required]],
        dob: this.fb.group(
          {
            year: [
              dob.editing.year,
              [
                Validators.required,
                Validators.min(1900),
                Validators.max(new Date().getFullYear()),
              ],
            ],
            month: [
              dob.editing.month,

              [Validators.required, Validators.min(1), Validators.max(12)],
            ],
            day: [
              dob.editing.day,
              [Validators.required, Validators.min(1), Validators.max(31)],
            ],
          },
          { validators: validDate }
        ),
      });

      const emailFormArray = this.createEmailArray(email);

      this.contactForm = this.fb.group({
        emails: emailFormArray,
      });
    })
  );

  constructor(
    private agencyStaffFacade: AgencyStaffFacade,
    private fb: FormBuilder
  ) {}

  terminateAgencyRole(request: RoleChangeRequest): void {
    this.agencyStaffFacade.dispatch(
      AgencyStaffActions.terminateAgencyRoleDetailPage({ request })
    );
  }

  createUpdateFromForm(demographicsForm: FormGroup): DemographicsUpdate {
    const { firstName, lastName, dob } = demographicsForm.value;

    const update: DemographicsUpdate = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      dob: `${dob.year}-${dob.month}-${dob.day}`,
    };

    return update;
  }

  cancelEditingDemographics(): void {
    this.editingDemographics = false;
    const { firstName, lastName, dob } = this.agencyStaff;
    this.demographicsForm.patchValue({
      firstName,
      lastName,
      dob: {
        year: dob.editing.year,
        month: dob.editing.month,
        day: dob.editing.day,
      },
    });
  }

  cancelEditingEmail(): void {
    this.editingContactInfo = false;
    const { email } = this.agencyStaff;

    this.contactForm.get('emails').setValue(email);
  }

  updateDemographics(): void {
    this.editingDemographics = false;

    const update = this.createUpdateFromForm(this.demographicsForm);

    if (this.demographicsChanged() === true) {
      this.agencyStaffFacade.dispatch(
        AgencyStaffActions.updateStaffDemographics({
          agencyStaff: this.agencyStaff,
          update,
        })
      );
    }
  }

  updateEmail(): void {
    this.editingContactInfo = false;

    const newEmails = this.contactForm.get('emails').value as AgentEmail[];

    this.agencyStaffFacade.dispatch(
      AgencyStaffActions.updateStaffEmail({
        agencyStaff: this.agencyStaff,
        newEmails,
      })
    );
  }

  demographicsChanged(): boolean {
    const { firstName, lastName, dob } = this.agencyStaff;
    const update = this.createUpdateFromForm(this.demographicsForm);

    const sameFirstName = firstName !== update.first_name.trim();
    const sameLastName = lastName !== update.last_name.trim();

    const { year, day, month } = dob.editing;
    const agencyStaffDob = `${year}-${month}-${day}`;

    const sameDob = agencyStaffDob !== update.dob;

    return sameFirstName || sameLastName || sameDob;
  }

  createEmailArray(emails: EmailVM[]): FormArray {
    const emailFormArray: FormArray = this.fb.array([]);

    for (const email of emails) {
      emailFormArray.push(
        this.fb.group({
          id: email.id,
          kind: EmailKind.Work,
          address: [email.address, [Validators.email, Validators.required]],
        })
      );
    }

    return emailFormArray;
  }

  get contactEmails(): FormArray {
    return this.contactForm.get('emails') as FormArray;
  }

  isValidEmail(index: number): boolean {
    return this.contactEmails.at(index).valid;
  }

  getDateError(errorCode: string): boolean {
    return this.demographicsForm.get('dob').hasError(errorCode);
  }

  validDemographicsForm(): boolean {
    return this.demographicsForm.valid && this.demographicsChanged() === true;
  }

  validDateControl(controlName: string): boolean {
    const formControl = this.demographicsForm.get('dob').get(controlName);

    return (
      formControl.hasError('max') === false &&
      formControl.hasError('required') === false
    );
  }
}
