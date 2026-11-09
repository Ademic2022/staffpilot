import { graphql } from "@/gql";
import type { EmployeeProfileQuery, ProfileLayoutQuery } from "@/gql/graphql";

export const EmployeeProfileDocument = graphql(`
  query EmployeeProfile($id: ID!) {
    employee(id: $id) {
      id
      completeness { percent missing { key label tab critical why } }
      employeeNumber
      fieldAccess
      fullName
      firstName
      middleName
      lastName
      preferredName
      workEmail
      personalEmail
      phone
      workPhone
      workPhoneExt
      dateOfBirth
      gender
      maritalStatus
      personal { nationality pronouns linkedinUrl twitter facebook homePhone addressLine1 addressLine2 city state postalCode country }
      photoUrl
      status
      hireDate
      probationEndDate
      terminationDate
      terminationReason
      employmentType
      archivedAt
      legalEntity { id name }
      department { id name }
      location { id name city country timezone }
      jobTitle { id name description }
      grade { id name }
      manager { id fullName jobTitle { name } photoUrl }
      directReports { id fullName jobTitle { name } }
      emergencyContacts {
        id name relationship phone workPhone workPhoneExt homePhone email isPrimary
        addressLine1 addressLine2 city state postalCode country
      }
      privateDetails { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }
      customValues { value field { id key name fieldType choices helpText hrOnly } }
      tableRows { id tableKey values createdAt }
      compensation { amount currency frequency effectiveDate payType paySchedule overtime }
      compensationHistory { id amount currency frequency effectiveDate reason payType paySchedule overtime comment }
      bonusTarget { percent amount }
      statusHistory { id effectiveDate status comment }
      notes { id body authorName createdAt }
      employmentHistory {
        id effectiveDate changeType reason
        jobTitle { name }
        department { name }
        location { name }
        grade { name }
        manager { fullName }
        employmentType
      }
    }
  }
`);

export const ProfileLayoutDocument = graphql(`
  query ProfileLayout {
    profileLayout {
      tabs {
        key name builtin
        sections { key title icon items { id kind key label fields } }
      }
      library { id kind key label fields }
    }
    customTables(includeInactive: true) { id key name hrOnly pay standard isActive columns { key name type choices } }
    customFields(includeInactive: true) { id key }
  }
`);

export const SaveProfileLayoutDocument = graphql(`
  mutation SaveProfileLayout($config: JSON!) {
    saveProfileLayout(config: $config) { layout { tabs { key } } errors { field message } }
  }
`);

export type Profile = EmployeeProfileQuery["employee"];
export type Layout = ProfileLayoutQuery["profileLayout"];
export type LayoutTab = Layout["tabs"][number];
export type LayoutSection = LayoutTab["sections"][number];
export type LayoutItem = LayoutSection["items"][number];
export type CustomTable = ProfileLayoutQuery["customTables"][number];
export type CustomFieldRef = ProfileLayoutQuery["customFields"][number];
