/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation ChangePassword($current: String!, $new: String!) {\n    changePassword(current: $current, new: $new) { ok errors { field message } }\n  }\n": typeof types.ChangePasswordDocument,
    "\n  mutation StartMfaSetup { startMfaSetup { secret uri qrSvg } }\n": typeof types.StartMfaSetupDocument,
    "\n  mutation ConfirmMfaSetup($code: String!) {\n    confirmMfaSetup(code: $code) { codes errors { field message } }\n  }\n": typeof types.ConfirmMfaSetupDocument,
    "\n  mutation DisableMfa($password: String!) {\n    disableMfa(password: $password) { ok errors { field message } }\n  }\n": typeof types.DisableMfaDocument,
    "\n  mutation NewRecoveryCodes($code: String!) {\n    newRecoveryCodes(code: $code) { codes errors { field message } }\n  }\n": typeof types.NewRecoveryCodesDocument,
    "\n  query MyAttendance {\n    myAttendance(days: 14) {\n      enabled shift shiftStart shiftEnd geofenced\n      clockedIn { id clockIn flags }\n      days { date shift scheduled worked late absent onLeave holiday\n        entries { id clockIn clockOut minutes flags note source }\n        overtime { id minutes status } }\n    }\n  }\n": typeof types.MyAttendanceDocument,
    "\n  mutation ClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id flags } errors { message } } }\n": typeof types.ClockInDocument,
    "\n  mutation ClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id minutes } errors { message } } }\n": typeof types.ClockOutDocument,
    "\n  query AttendanceBoard($date: Date) { attendanceBoard(date: $date) { employeeId employeeName department status clockIn clockOut worked flags } }\n": typeof types.AttendanceBoardDocument,
    "\n  query AttendanceDays($id: ID!, $start: Date!, $end: Date!) {\n    attendanceDays(employeeId: $id, start: $start, end: $end) { date shift scheduled worked late absent onLeave holiday\n      entries { id clockIn clockOut minutes flags note source } overtime { id minutes status } }\n  }\n": typeof types.AttendanceDaysDocument,
    "\n  mutation SaveTimeEntry($input: TimeEntryInput!) { saveTimeEntry(input: $input) { entry { id } errors { field message } } }\n": typeof types.SaveTimeEntryDocument,
    "mutation DeleteTimeEntry($id: ID!) { deleteTimeEntry(id: $id) }": typeof types.DeleteTimeEntryDocument,
    "\n  query OvertimeToDecide { overtimeToDecide { id employeeName date minutes } }\n": typeof types.OvertimeToDecideDocument,
    "\n  mutation DecideOvertime($id: ID!, $approve: Boolean!) { decideOvertime(id: $id, approve: $approve) { id status } }\n": typeof types.DecideOvertimeDocument,
    "\n  mutation ArchiveEmployee($id: ID!) {\n    archiveEmployee(id: $id) { employee { id } errors { field message } }\n  }\n": typeof types.ArchiveEmployeeDocument,
    "\n  mutation SendEmployeePasswordReset($employeeId: ID!) {\n    sendEmployeePasswordReset(employeeId: $employeeId)\n  }\n": typeof types.SendEmployeePasswordResetDocument,
    "\n  query EmployeeAccess($id: ID!) {\n    employee(id: $id) { id access { email roles isActive invitePending } }\n  }\n": typeof types.EmployeeAccessDocument,
    "\n  mutation RemoveEmployeePhoto($employeeId: ID!) {\n    removeEmployeePhoto(employeeId: $employeeId)\n  }\n": typeof types.RemoveEmployeePhotoDocument,
    "\n  mutation HireEmployee($input: HireEmployeeInput!) {\n    hireEmployee(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n": typeof types.HireEmployeeDocument,
    "\n  query MyDirectoryAccess { myDirectoryAccess { directory orgChart } }\n": typeof types.MyDirectoryAccessDocument,
    "\n  query PendingChanges {\n    pendingChangeRequests { id employeeId employeeName createdAt canDecide lines { field label current requested } }\n  }\n": typeof types.PendingChangesDocument,
    "\n  mutation DecideChangeRequest($id: ID!, $approve: Boolean!, $note: String) {\n    decideChangeRequest(id: $id, approve: $approve, note: $note) { request { id status } errors { field message } }\n  }\n": typeof types.DecideChangeRequestDocument,
    "\n  query ExpenseClaim($id: ID!) {\n    expenseClaim(id: $id) {\n      ...ClaimRowFields\n      lines { id categoryId categoryName date description amount distanceKm receiptName receiptUrl flags }\n      actions { id actor action stage note createdAt }\n    }\n    expenseCategories { id name description limitPerItem limitPerMonth receiptRequired mileageRate }\n    expenseSettings { receiptOver maxAgeDays payVia }\n  }\n": typeof types.ExpenseClaimDocument,
    "mutation RenameExpenseClaim($id: ID!, $title: String!) { renameExpenseClaim(id: $id, title: $title) { claim { id title } errors { message } } }": typeof types.RenameExpenseClaimDocument,
    "mutation DeleteExpenseLine($id: ID!) { deleteExpenseLine(id: $id) { claim { id total } errors { message } } }": typeof types.DeleteExpenseLineDocument,
    "mutation SubmitExpenseClaim($id: ID!) { submitExpenseClaim(id: $id) { claim { id status } errors { message } } }": typeof types.SubmitExpenseClaimDocument,
    "mutation WithdrawExpenseClaim($id: ID!) { withdrawExpenseClaim(id: $id) { claim { id status } errors { message } } }": typeof types.WithdrawExpenseClaimDocument,
    "\n  mutation DecideExpenseClaim($id: ID!, $action: String!, $note: String!) {\n    decideExpenseClaim(id: $id, action: $action, note: $note) { claim { id status stage } errors { field message } }\n  }\n": typeof types.DecideExpenseClaimDocument,
    "query MyExpenseClaims { myExpenseClaims { ...ClaimRowFields } expenseSettings { enabled payVia } }": typeof types.MyExpenseClaimsDocument,
    "query ExpensesToApprove { expensesToApprove { ...ClaimRowFields } }": typeof types.ExpensesToApproveDocument,
    "\n  query ExpenseClaims($status: String, $search: String!) { expenseClaims(status: $status, search: $search) { ...ClaimRowFields } }\n": typeof types.ExpenseClaimsDocument,
    "\n  mutation CreateExpenseClaim($title: String!) { createExpenseClaim(title: $title) { claim { id } errors { field message } } }\n": typeof types.CreateExpenseClaimDocument,
    "mutation MarkExpenseClaimsPaid($ids: [ID!]!, $reference: String!) { markExpenseClaimsPaid(ids: $ids, reference: $reference) }": typeof types.MarkExpenseClaimsPaidDocument,
    "\n  query CompanyFolders {\n    companyFolders { id name fileCount }\n  }\n": typeof types.CompanyFoldersDocument,
    "\n  query CompanyFiles($folderId: ID, $search: String) {\n    companyFiles(folderId: $folderId, search: $search) {\n      id title originalName contentType size shared folderId uploadedBy createdAt requiresAcknowledgement acknowledgedByMe acknowledgedCount\n    }\n  }\n": typeof types.CompanyFilesDocument,
    "\n  mutation SaveCompanyFolder($name: String!, $id: ID) {\n    saveCompanyFolder(name: $name, id: $id) { folder { id name } errors { field message } }\n  }\n": typeof types.SaveCompanyFolderDocument,
    "\n  mutation DeleteCompanyFolder($id: ID!) {\n    deleteCompanyFolder(id: $id)\n  }\n": typeof types.DeleteCompanyFolderDocument,
    "\n  mutation UpdateCompanyFile($input: UpdateCompanyFileInput!) {\n    updateCompanyFile(input: $input) { file { id } errors { field message } }\n  }\n": typeof types.UpdateCompanyFileDocument,
    "\n  mutation RemoveCompanyFiles($ids: [ID!]!) {\n    removeCompanyFiles(ids: $ids)\n  }\n": typeof types.RemoveCompanyFilesDocument,
    "\n  mutation AcknowledgeCompanyFile($id: ID!) { acknowledgeCompanyFile(id: $id) { id acknowledgedByMe } }\n": typeof types.AcknowledgeCompanyFileDocument,
    "\n  query FileAcknowledgements($id: ID!) { fileAcknowledgements(id: $id) { name email acknowledgedAt } }\n": typeof types.FileAcknowledgementsDocument,
    "\n  mutation CompanyFileDownloadUrl($id: ID!) {\n    companyFileDownloadUrl(id: $id)\n  }\n": typeof types.CompanyFileDownloadUrlDocument,
    "\n  query HomeExpiring {\n    expiringDocuments(withinDays: 30) { id }\n  }\n": typeof types.HomeExpiringDocument,
    "\n  query HomeMyPhoto($id: ID!) {\n    employee(id: $id) { id photoUrl }\n  }\n": typeof types.HomeMyPhotoDocument,
    "\n  mutation SaveHomeLayout($widgets: JSON!) {\n    saveHomeLayout(widgets: $widgets) { key hidden }\n  }\n": typeof types.SaveHomeLayoutDocument,
    "\n  mutation AddMeAsEmployee { addMeAsEmployee { employee { id } errors { message } } }\n": typeof types.AddMeAsEmployeeDocument,
    "\n  query LeaveApprovals($everyone: Boolean!) {\n    leaveApprovals(everyone: $everyone) {\n      id startDate endDate halfDay days reason status createdAt canDecide decideAsOverride\n      employee { id fullName }\n      leaveType { id name color }\n      waitingFor { id fullName }\n      approvals { level status note overridden actedBy actedAt approver { id fullName } }\n    }\n    myDelegations { id startDate endDate delegator { id fullName } delegate { id fullName } }\n  }\n": typeof types.LeaveApprovalsDocument,
    "\n  mutation DecideLeave($input: DecideLeaveInput!) {\n    decideLeave(input: $input) {\n      request { id status }\n      errors { field message }\n    }\n  }\n": typeof types.DecideLeaveDocument,
    "\n  query DelegatePeople {\n    employees(filter: { statuses: [ACTIVE, PROBATION] }, first: 100) { nodes { id fullName } }\n  }\n": typeof types.DelegatePeopleDocument,
    "\n  mutation DelegateApprovals($input: DelegateInput!) {\n    delegateApprovals(input: $input) { delegation { id } errors { field message } }\n  }\n": typeof types.DelegateApprovalsDocument,
    "\n  mutation RevokeDelegation($id: ID!) {\n    revokeDelegation(id: $id) { delegation { id } errors { field message } }\n  }\n": typeof types.RevokeDelegationDocument,
    "\n  query LeaveCalendar($start: Date!, $end: Date!, $departmentId: ID) {\n    leaveCalendar(start: $start, end: $end, departmentId: $departmentId) {\n      absences {\n        requestId startDate endDate halfDay status\n        employee { id fullName }\n        leaveType { id name color }\n      }\n      holidays { id name date location { name } }\n    }\n  }\n": typeof types.LeaveCalendarDocument,
    "\n  query CalendarDepartments {\n    departments { id name isActive }\n  }\n": typeof types.CalendarDepartmentsDocument,
    "\n  query UpcomingHolidays($year: Int!, $next: Int!) {\n    thisYear: publicHolidays(year: $year) { id name date location { name } }\n    nextYear: publicHolidays(year: $next) { id name date location { name } }\n  }\n": typeof types.UpcomingHolidaysDocument,
    "\n  query PayrollHome {\n    payrollRuns { id payGroup currency periodStart periodEnd payDate status offCycle headcount gross net warnings published canApprove }\n    payGroups { id name frequency isActive supported }\n  }\n": typeof types.PayrollHomeDocument,
    "\n  query PayrollPeople {\n    payrollPeople { employeeId payGroupId taxState pensionProvider socialSecurityNumber nhfNumber contributesNhf pensionExempt annualRent annualLifeInsurance voluntaryPensionPercent }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName employeeNumber department { name } } }\n    payGroups { id name isActive }\n    payComponents { id name kind role isActive }\n  }\n": typeof types.PayrollPeopleDocument,
    "\n  mutation CreatePayrollRun($group: ID!, $start: Date!, $offCycle: Boolean!, $note: String!) {\n    createPayrollRun(payGroupId: $group, periodStart: $start, offCycle: $offCycle, note: $note) { run { id } errors { field message } }\n  }\n": typeof types.CreatePayrollRunDocument,
    "\n  mutation AssignPayGroup($ids: [ID!]!, $group: ID) { assignPayGroup(employeeIds: $ids, payGroupId: $group) }\n": typeof types.AssignPayGroupDocument,
    "\n  mutation SavePayrollProfile($input: PayrollProfileInput!) { savePayrollProfile(input: $input) { profile { employeeId } errors { field message } } }\n": typeof types.SavePayrollProfileDocument,
    "\n  query PayItems($id: ID!) { payItems(employeeId: $id) { id componentId component kind amount startDate endDate note } }\n": typeof types.PayItemsDocument,
    "\n  mutation SavePayItem($input: PayItemInput!) { savePayItem(input: $input) { item { id } errors { field message } } }\n": typeof types.SavePayItemDocument,
    "mutation DeletePayItem($id: ID!) { deletePayItem(id: $id) }": typeof types.DeletePayItemDocument,
    "\n  query PayrollRunDetail($id: ID!) {\n    payrollRun(id: $id) {\n      id payGroup currency periodStart periodEnd payDate status offCycle note createdBy submittedBy approvedBy published\n      headcount gross deductions net employerCost warnings canApprove\n      payslips { id employeeName employeeNumber gross totalDeductions net employerCost lines workings warnings daysPaid daysInPeriod rulePack }\n      variance { employeeId employeeName net previous change percent flag }\n    }\n  }\n": typeof types.PayrollRunDetailDocument,
    "\n  mutation PayrollRunAction($id: ID!, $recalc: Boolean!, $submit: Boolean!, $approve: Boolean!, $publish: Boolean!, $paid: Boolean!, $cancel: Boolean!) {\n    recalculatePayrollRun(id: $id) @include(if: $recalc) { errors { message } }\n    submitPayrollRun(id: $id) @include(if: $submit) { errors { message } }\n    approvePayrollRun(id: $id) @include(if: $approve) { errors { message } }\n    publishPayslips(id: $id) @include(if: $publish) { errors { message } }\n    markPayrollPaid(id: $id) @include(if: $paid) { errors { message } }\n    cancelPayrollRun(id: $id) @include(if: $cancel) { errors { message } }\n  }\n": typeof types.PayrollRunActionDocument,
    "\n  mutation SendBackPayrollRun($id: ID!, $note: String!) { sendBackPayrollRun(id: $id, note: $note) { errors { message } } }\n": typeof types.SendBackPayrollRunDocument,
    "\n  query MyPayslips {\n    myPayslips { id periodStart periodEnd payDate currency gross totalDeductions net lines }\n  }\n": typeof types.MyPayslipsDocument,
    "\n  query CycleReviews($id: ID!) {\n    reviewCycle(id: $id) { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds\n      people selfDone managerDone shared }\n    cycleReviews(cycleId: $id) { ...ReviewRowFields calibrationNote }\n    reviewTemplates { id name isActive }\n    departments { id name }\n  }\n": typeof types.CycleReviewsDocument,
    "mutation LaunchReviewCycle($id: ID!) { launchReviewCycle(id: $id) { cycle { id status } errors { message } } }": typeof types.LaunchReviewCycleDocument,
    "mutation CloseReviewCycle($id: ID!) { closeReviewCycle(id: $id) { cycle { id status } errors { message } } }": typeof types.CloseReviewCycleDocument,
    "mutation DeleteReviewCycle($id: ID!) { deleteReviewCycle(id: $id) }": typeof types.DeleteReviewCycleDocument,
    "\n  mutation CalibrateFromCycle($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { id calibratedRating calibrationNote } }\n": typeof types.CalibrateFromCycleDocument,
    "\n  query Goals($employeeId: ID) {\n    goals(employeeId: $employeeId) { ...GoalFields }\n    company: goals { ...GoalFields }\n    teamGoals { ...GoalFields }\n    myReports { id name jobTitle direct }\n  }\n": typeof types.GoalsDocument,
    "query AlignableGoals($employeeId: ID) { alignableGoals(employeeId: $employeeId) { id title employeeName } }": typeof types.AlignableGoalsDocument,
    "query GoalUpdates($id: ID!) { goal(id: $id) { id updates { id author progress status note createdAt } } }": typeof types.GoalUpdatesDocument,
    "\n  mutation SaveGoal($input: GoalInput!) { saveGoal(input: $input) { goal { ...GoalFields } errors { field message } } }\n": typeof types.SaveGoalDocument,
    "\n  mutation CheckInGoal($input: GoalCheckInInput!) { checkInGoal(input: $input) { goal { ...GoalFields } errors { field message } } }\n": typeof types.CheckInGoalDocument,
    "mutation DeleteGoal($id: ID!) { deleteGoal(id: $id) }": typeof types.DeleteGoalDocument,
    "\n  query MyReviews { myReviews { ...ReviewRowFields } teamReviews { ...ReviewRowFields } }\n": typeof types.MyReviewsDocument,
    "\n  query Feedback($employeeId: ID) {\n    feedback(employeeId: $employeeId) { id giverName recipientId recipientName body private mine createdAt }\n    myReports { id name direct }\n  }\n": typeof types.FeedbackDocument,
    "\n  mutation GiveFeedback($recipientId: ID!, $body: String!, $private: Boolean) {\n    giveFeedback(recipientId: $recipientId, body: $body, private: $private) { feedback { id } errors { field message } }\n  }\n": typeof types.GiveFeedbackDocument,
    "mutation DeleteFeedback($id: ID!) { deleteFeedback(id: $id) }": typeof types.DeleteFeedbackDocument,
    "\n  query OneOnOnes { oneOnOnes { id managerId managerName employeeId employeeName date agenda notes privateNotes actionItems myRole } myReports { id name direct } }\n": typeof types.OneOnOnesDocument,
    "\n  mutation SaveOneOnOne($input: OneOnOneInput!) { saveOneOnOne(input: $input) { oneOnOne { id } errors { field message } } }\n": typeof types.SaveOneOnOneDocument,
    "mutation DeleteOneOnOne($id: ID!) { deleteOneOnOne(id: $id) }": typeof types.DeleteOneOnOneDocument,
    "\n  query ReviewCycles {\n    reviewCycles { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds\n      people selfDone managerDone shared }\n    reviewTemplates { id name isActive }\n    departments { id name }\n  }\n": typeof types.ReviewCyclesDocument,
    "\n  query Review($id: ID!) {\n    review(id: $id) {\n      review { ...ReviewRowFields calibrationNote }\n      questions\n      responses { id role authorId authorName answers submittedAt declinedAt mine }\n      peers { id name status }\n      sharedAt acknowledgedAt employeeComment periodStart periodEnd includePeers canManage canCalibrate isEmployee\n    }\n  }\n": typeof types.ReviewDocument,
    "\n  mutation SaveReviewResponse($id: ID!, $answers: JSON!, $submit: Boolean) {\n    saveReviewResponse(id: $id, answers: $answers, submit: $submit) { response { id submittedAt } errors { field message } }\n  }\n": typeof types.SaveReviewResponseDocument,
    "mutation DeclinePeerReview($id: ID!) { declinePeerReview(id: $id) }": typeof types.DeclinePeerReviewDocument,
    "\n  mutation RequestPeerReviews($reviewId: ID!, $employeeIds: [ID!]!) { requestPeerReviews(reviewId: $reviewId, employeeIds: $employeeIds) { peers { id } } }\n": typeof types.RequestPeerReviewsDocument,
    "mutation ShareReview($id: ID!) { shareReview(id: $id) { sharedAt } }": typeof types.ShareReviewDocument,
    "mutation AcknowledgeReview($id: ID!, $comment: String!) { acknowledgeReview(id: $id, comment: $comment) { acknowledgedAt } }": typeof types.AcknowledgeReviewDocument,
    "\n  mutation CalibrateReview($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { calibratedRating } }\n": typeof types.CalibrateReviewDocument,
    "\n  query RunReport($key: String!, $params: ReportParams) {\n    runReport(key: $key, params: $params) {\n      title chart note start end rows\n      columns { key label kind }\n      summary { label value }\n    }\n  }\n": typeof types.RunReportDocument,
    "\n  query ReportFilterOptions {\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    departments { id name isActive }\n  }\n": typeof types.ReportFilterOptionsDocument,
    "\n  query RunCustomReport($id: ID!) {\n    runCustomReport(id: $id) { title chart note rows columns { key label kind } summary { label value } }\n  }\n": typeof types.RunCustomReportDocument,
    "\n  mutation DeleteCustomReport($id: ID!) {\n    deleteCustomReport(id: $id)\n  }\n": typeof types.DeleteCustomReportDocument,
    "\n  query EmailAlertsAdmin {\n    emailAlerts { id name kind field daysBefore recipients enabled lastSentOn }\n    alertOptions { kinds { key label } dateFields { key label } recipientTypes { key label } }\n    roles { code name }\n    members { id fullName email isActive }\n  }\n": typeof types.EmailAlertsAdminDocument,
    "\n  mutation SaveEmailAlert($input: EmailAlertInput!) {\n    saveEmailAlert(input: $input) { alert { id } errors { field message } }\n  }\n": typeof types.SaveEmailAlertDocument,
    "mutation DeleteEmailAlert($id: ID!) { deleteEmailAlert(id: $id) }": typeof types.DeleteEmailAlertDocument,
    "mutation SendEmailAlertNow($id: ID!) { sendEmailAlertNow(id: $id) }": typeof types.SendEmailAlertNowDocument,
    "\n  query ApprovalsSettings {\n    approvalChains { kind name enabled steps }\n    approvalStepTypes { key label }\n    roles { code name }\n    members { id fullName email isActive }\n  }\n": typeof types.ApprovalsSettingsDocument,
    "\n  mutation SaveApprovalChain($kind: String!, $enabled: Boolean!, $steps: JSON!) {\n    saveApprovalChain(kind: $kind, enabled: $enabled, steps: $steps) { chain { kind } errors { field message } }\n  }\n": typeof types.SaveApprovalChainDocument,
    "\n  query AttendanceSetup {\n    attendanceSettings { enabled graceMinutes requireLocation overtimeAfterMinutes overtimeMultiplier payOvertime deductAbsence timesheetsEnabled }\n    shifts { id name start end breakMinutes weekdays isDefault isActive people }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }\n  }\n": typeof types.AttendanceSetupDocument,
    "\n  mutation SaveAttendanceSettings($input: AttendanceSettingsInput!) { saveAttendanceSettings(input: $input) { enabled } }\n": typeof types.SaveAttendanceSettingsDocument,
    "\n  mutation SaveShift($input: ShiftInput!) { saveShift(input: $input) { shift { id } errors { field message } } }\n": typeof types.SaveShiftDocument,
    "\n  mutation AssignShift($shift: ID!, $ids: [ID!]!, $start: Date!) { assignShift(shiftId: $shift, employeeIds: $ids, startDate: $start) }\n": typeof types.AssignShiftDocument,
    "\n  query AuditLog($search: String, $action: String, $from: String, $to: String, $offset: Int!) {\n    auditLog(search: $search, action: $action, dateFrom: $from, dateTo: $to, offset: $offset, limit: 50) {\n      hasMore\n      entries { id at actor action objectType objectId summary changes ipAddress }\n    }\n  }\n": typeof types.AuditLogDocument,
    "\n  query BenefitPlansSetup {\n    benefitPlans(includeInactive: true) {\n      id name kind provider description employeeRate employerRate basis statutory isActive enrolledCount\n    }\n  }\n": typeof types.BenefitPlansSetupDocument,
    "\n  mutation SaveBenefitPlan($input: SaveBenefitPlanInput!) {\n    saveBenefitPlan(input: $input) { plan { id } errors { field message } }\n  }\n": typeof types.SaveBenefitPlanDocument,
    "\n  query TaskTemplates {\n    taskTemplates { id kind title description category assignee dueOffset isActive appliesTo }\n    departments { id name isActive }\n    locations { id name isActive }\n  }\n": typeof types.TaskTemplatesDocument,
    "\n  mutation SaveTaskTemplate($input: SaveTaskTemplateInput!) {\n    saveTaskTemplate(input: $input) { template { id } errors { field message } }\n  }\n": typeof types.SaveTaskTemplateDocument,
    "\n  query CompanySettings {\n    companySettings {\n      name country currency timezone primaryColor logoUrl requireAdminMfa sessionTimeoutMinutes ipAllowlist yourIp\n      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads payrollEnabled\n    }\n  }\n": typeof types.CompanySettingsDocument,
    "\n  mutation UpdateCompanySettings($input: CompanySettingsInput!) {\n    updateCompanySettings(input: $input) { settings { name } errors { field message } }\n  }\n": typeof types.UpdateCompanySettingsDocument,
    "\n  mutation RemoveCompanyLogo { removeCompanyLogo }\n": typeof types.RemoveCompanyLogoDocument,
    "\n  query DirectorySettingsAdmin {\n    directorySettings { directory orgChart roles fields }\n    directoryFieldChoices { key label }\n    roles { code name }\n  }\n": typeof types.DirectorySettingsAdminDocument,
    "\n  mutation SaveDirectorySettings($settings: JSON!) {\n    saveDirectorySettings(settings: $settings) { directory }\n  }\n": typeof types.SaveDirectorySettingsDocument,
    "\n  query ExpenseSetup {\n    expenseSettings { enabled managerApproval financeApproval receiptOver maxAgeDays payVia }\n    expenseCategories(includeInactive: true) { id name description accountCode limitPerItem limitPerMonth receiptRequired mileageRate isActive used }\n  }\n": typeof types.ExpenseSetupDocument,
    "\n  mutation SaveExpenseSettings($input: ExpenseSettingsInput!) { saveExpenseSettings(input: $input) { enabled } }\n": typeof types.SaveExpenseSettingsDocument,
    "\n  mutation SaveExpenseCategory($input: ExpenseCategoryInput!) { saveExpenseCategory(input: $input) { category { id } errors { field message } } }\n": typeof types.SaveExpenseCategoryDocument,
    "\n  query CustomFieldsAdmin {\n    customFields(includeInactive: true) { id name key fieldType choices helpText hrOnly position isActive }\n  }\n": typeof types.CustomFieldsAdminDocument,
    "\n  mutation SaveCustomField($input: SaveCustomFieldInput!) {\n    saveCustomField(input: $input) { field { id } errors { field message } }\n  }\n": typeof types.SaveCustomFieldDocument,
    "\n  query Organization {\n    legalEntities { id name registrationNumber country currency isActive }\n    locations { id name address city country timezone latitude longitude radiusM isActive legalEntity { id name } }\n    departments { id name code isActive legalEntity { id name } parent { id name } head { id fullName } }\n    jobTitles { id name description isActive }\n    grades { id name rank isActive payMin payMid payMax }\n    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }\n    aiWriting\n  }\n": typeof types.OrganizationDocument,
    "\n  mutation DraftJobDescription($title: String!, $notes: String!) { draftJobDescription(title: $title, notes: $notes) }\n": typeof types.DraftJobDescriptionDocument,
    "\n  mutation SaveLegalEntity($input: SaveLegalEntityInput!) {\n    saveLegalEntity(input: $input) { legalEntity { id } errors { field message } }\n  }\n": typeof types.SaveLegalEntityDocument,
    "\n  mutation SaveLocation($input: SaveLocationInput!) {\n    saveLocation(input: $input) { location { id } errors { field message } }\n  }\n": typeof types.SaveLocationDocument,
    "\n  mutation SaveDepartment($input: SaveDepartmentInput!) {\n    saveDepartment(input: $input) { department { id } errors { field message } }\n  }\n": typeof types.SaveDepartmentDocument,
    "\n  mutation SaveJobTitle($input: SaveJobTitleInput!) {\n    saveJobTitle(input: $input) { jobTitle { id } errors { field message } }\n  }\n": typeof types.SaveJobTitleDocument,
    "\n  mutation SaveGrade($input: SaveGradeInput!) {\n    saveGrade(input: $input) { grade { id } errors { field message } }\n  }\n": typeof types.SaveGradeDocument,
    "\n  query PayrollSettings {\n    payGroups { id name legalEntityId legalEntity country currency frequency payDay anchorDate isActive memberCount supported }\n    payComponents { id code name kind role percentOfGross taxable pensionable isActive }\n    rulePacks { id country effectiveFrom name data source }\n    legalEntities { id name country isActive }\n  }\n": typeof types.PayrollSettingsDocument,
    "\n  mutation SavePayGroup($input: PayGroupInput!) { savePayGroup(input: $input) { group { id } errors { field message } } }\n": typeof types.SavePayGroupDocument,
    "\n  mutation SavePayComponent($input: PayComponentInput!) { savePayComponent(input: $input) { component { id } errors { field message } } }\n": typeof types.SavePayComponentDocument,
    "query ReviewTemplates { reviewTemplates { id name questions scale isActive cycles } }": typeof types.ReviewTemplatesDocument,
    "\n  mutation SaveReviewTemplate($input: ReviewTemplateInput!) { saveReviewTemplate(input: $input) { template { id } errors { field message } } }\n": typeof types.SaveReviewTemplateDocument,
    "mutation DeleteReviewTemplate($id: ID!) { deleteReviewTemplate(id: $id) }": typeof types.DeleteReviewTemplateDocument,
    "\n  query LeaveSetup($year: Int!) {\n    leaveTypes(includeInactive: true) { id name code color isPaid tracksBalance paidOutOnExit allowHalfDays approvalLevels isActive }\n    leavePolicies {\n      id name daysPerYear accrual proRata startsOn carryOverMax carryOverExpiryMonths employmentType isActive\n      leaveType { id name color }\n      legalEntity { id name }\n      location { id name }\n      grade { id name }\n      tenureRules { years extraDays }\n    }\n    publicHolidays(year: $year) { id name date location { id name } }\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    grades { id name isActive }\n  }\n": typeof types.LeaveSetupDocument,
    "\n  mutation SaveLeaveType($input: SaveLeaveTypeInput!) {\n    saveLeaveType(input: $input) { leaveType { id } errors { field message } }\n  }\n": typeof types.SaveLeaveTypeDocument,
    "\n  mutation SaveLeavePolicy($input: SaveLeavePolicyInput!) {\n    saveLeavePolicy(input: $input) { policy { id } errors { field message } }\n  }\n": typeof types.SaveLeavePolicyDocument,
    "\n  mutation SavePublicHoliday($input: SavePublicHolidayInput!) {\n    savePublicHoliday(input: $input) { holiday { id } errors { field message } }\n  }\n": typeof types.SavePublicHolidayDocument,
    "\n  mutation DeletePublicHoliday($id: ID!) {\n    deletePublicHoliday(id: $id)\n  }\n": typeof types.DeletePublicHolidayDocument,
    "\n  query TrainingAdmin {\n    trainingCourses(includeInactive: true) { id name description category required frequencyMonths dueDays appliesTo isActive }\n    departments { id name isActive }\n    locations { id name isActive }\n  }\n": typeof types.TrainingAdminDocument,
    "\n  mutation SaveTrainingCourse($input: TrainingCourseInput!) {\n    saveTrainingCourse(input: $input) { course { id } errors { field message } }\n  }\n": typeof types.SaveTrainingCourseDocument,
    "mutation DeleteTrainingCourse($id: ID!) { deleteTrainingCourse(id: $id) }": typeof types.DeleteTrainingCourseDocument,
    "\n  query UsersAdmin {\n    members {\n      id email firstName lastName fullName isActive invitePending lastLogin\n      roles { code name scope }\n      employee { id name }\n      legalEntities { id name }\n      locations { id name }\n      departments { id name }\n    }\n    roles { id code name scope permissions }\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    departments { id name isActive }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE, CANDIDATE] }) { nodes { id fullName } }\n  }\n": typeof types.UsersAdminDocument,
    "\n  mutation InviteMember($input: InviteMemberInput!) {\n    inviteMember(input: $input) { member { id } errors { field message } }\n  }\n": typeof types.InviteMemberDocument,
    "\n  mutation UpdateMember($input: UpdateMemberInput!) {\n    updateMember(input: $input) { member { id } errors { field message } }\n  }\n": typeof types.UpdateMemberDocument,
    "\n  mutation CorrectInvite($input: CorrectInviteInput!) {\n    correctInvite(input: $input) { member { id } errors { field message } }\n  }\n": typeof types.CorrectInviteDocument,
    "\n  mutation CancelInvite($id: ID!) {\n    cancelInvite(id: $id) { errors { field message } }\n  }\n": typeof types.CancelInviteDocument,
    "\n  mutation ResendInvite($id: ID!) {\n    resendInvite(id: $id)\n  }\n": typeof types.ResendInviteDocument,
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": typeof types.RequestPasswordResetDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      mfaRequired\n      me { permissions }\n      errors { field message }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation VerifyMfa($code: String!) {\n    verifyMfa(code: $code) {\n      me { permissions }\n      errors { field message }\n    }\n  }\n": typeof types.VerifyMfaDocument,
    "\n  query PasswordLink($uid: String!, $token: String!) {\n    passwordLink(uid: $uid, token: $token)\n  }\n": typeof types.PasswordLinkDocument,
    "\n  mutation SetPassword($input: SetPasswordInput!) {\n    setPassword(input: $input) { ok errors { field message } }\n  }\n": typeof types.SetPasswordDocument,
    "\n  mutation RedeemWelcome($token: String!) {\n    redeemWelcome(token: $token) { me { mfaSetupRequired } errors { message } }\n  }\n": typeof types.RedeemWelcomeDocument,
    "\n  query SlugCheck($slug: String!) {\n    slugCheck(slug: $slug)\n  }\n": typeof types.SlugCheckDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) { url codeSentTo errors { field message } }\n  }\n": typeof types.SignUpDocument,
    "\n  query SignupEmailCheck($email: String!) {\n    signupEmailCheck(email: $email) { problem freeWebmail }\n  }\n": typeof types.SignupEmailCheckDocument,
    "\n  mutation Logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  query WaitingApprovals {\n    leaveApprovals { id }\n    pendingChanges { id canDecide }\n  }\n": typeof types.WaitingApprovalsDocument,
    "\n  mutation StopViewAs { stopViewAs { permissions } }\n": typeof types.StopViewAsDocument,
    "\n  query GlobalSearch($q: String!) {\n    search(q: $q) { kind title subtitle href photoUrl }\n  }\n": typeof types.GlobalSearchDocument,
    "\n  query NotificationList($first: Int!, $after: String) {\n    unreadNotificationCount\n    notifications(first: $first, after: $after) {\n      nodes { id kind title body link read createdAt }\n      pageInfo { hasNextPage endCursor }\n    }\n  }\n": typeof types.NotificationListDocument,
    "\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n": typeof types.UnreadNotificationCountDocument,
    "\n  mutation MarkNotificationsRead($ids: [ID!]) {\n    markNotificationsRead(ids: $ids)\n  }\n": typeof types.MarkNotificationsReadDocument,
    "query PushPublicKey { pushPublicKey }": typeof types.PushPublicKeyDocument,
    "\n  mutation SavePushSubscription($endpoint: String!, $p256dh: String!, $auth: String!, $userAgent: String!) {\n    savePushSubscription(endpoint: $endpoint, p256dh: $p256dh, auth: $auth, userAgent: $userAgent)\n  }\n": typeof types.SavePushSubscriptionDocument,
    "mutation RemovePushSubscription($endpoint: String!) { removePushSubscription(endpoint: $endpoint) }": typeof types.RemovePushSubscriptionDocument,
    "\n  query PendingPayJobChanges {\n    pendingChanges { id kind kindName employeeId employeeName summary status step stepCount requestedBy createdAt canDecide canCancel }\n  }\n": typeof types.PendingPayJobChangesDocument,
    "\n  mutation DecidePendingChange($id: ID!, $approve: Boolean!, $note: String) {\n    decidePendingChange(id: $id, approve: $approve, note: $note) { change { id status } errors { message } }\n  }\n": typeof types.DecidePendingChangeDocument,
    "\n  mutation CancelPendingChange($id: ID!) {\n    cancelPendingChange(id: $id) { change { id status } errors { message } }\n  }\n": typeof types.CancelPendingChangeDocument,
    "\n  query MyClock {\n    myAttendance(days: 1) { enabled shift shiftStart shiftEnd geofenced clockedIn { id clockIn } }\n  }\n": typeof types.MyClockDocument,
    "\n  mutation PillClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }\n": typeof types.PillClockInDocument,
    "\n  mutation PillClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }\n": typeof types.PillClockOutDocument,
    "\n  query Projects { projects { id name code client costCentre billable employeeIds isActive } }\n": typeof types.ProjectsDocument,
    "\n  mutation SaveProject($input: ProjectInput!) { saveProject(input: $input) { project { id } errors { field message } } }\n": typeof types.SaveProjectDocument,
    "\n  fragment TimesheetFields on Timesheet {\n    id employeeId employeeName weekStart status submittedAt decidedBy decidedAt note totalMinutes mine canApprove\n    entries { projectId projectName date minutes note }\n    clocked { date minutes }\n  }\n": typeof types.TimesheetFieldsFragmentDoc,
    "\n  query MyTimesheet($week: Date!) { myTimesheet(weekStart: $week) { ...TimesheetFields } myProjects { id name code client } }\n": typeof types.MyTimesheetDocument,
    "\n  mutation SaveTimesheet($week: Date!, $entries: [TimesheetCellInput!]!) {\n    saveTimesheet(weekStart: $week, entries: $entries) { timesheet { ...TimesheetFields } errors { field message } }\n  }\n": typeof types.SaveTimesheetDocument,
    "\n  mutation SubmitTimesheet($week: Date!) { submitTimesheet(weekStart: $week) { timesheet { ...TimesheetFields } errors { message } } }\n": typeof types.SubmitTimesheetDocument,
    "query TimesheetsToApprove { timesheetsToApprove { ...TimesheetFields } }": typeof types.TimesheetsToApproveDocument,
    "query TeamTimesheets($week: Date!) { teamTimesheets(weekStart: $week) { ...TimesheetFields } }": typeof types.TeamTimesheetsDocument,
    "\n  mutation DecideTimesheet($id: ID!, $approve: Boolean!, $note: String!) {\n    decideTimesheet(id: $id, approve: $approve, note: $note) { timesheet { id status } errors { field message } }\n  }\n": typeof types.DecideTimesheetDocument,
    "\n  mutation ReopenTimesheet($id: ID!, $note: String!) { reopenTimesheet(id: $id, note: $note) { timesheet { id status } errors { message } } }\n": typeof types.ReopenTimesheetDocument,
    "\n  mutation EmailMyCompanies($email: String!) {\n    emailMyCompanies(email: $email)\n  }\n": typeof types.EmailMyCompaniesDocument,
    "\n  query EmployeeDocuments($employeeId: ID!) {\n    employeeDocuments(employeeId: $employeeId) {\n      id title originalName contentType size expiresOn notes uploadedBy createdAt\n      category { id name requiresExpiry employeeCanView managerCanView }\n    }\n  }\n": typeof types.EmployeeDocumentsDocument,
    "\n  query DocumentCategoryOptions {\n    documentCategories { id name requiresExpiry employeeCanView managerCanView isActive }\n  }\n": typeof types.DocumentCategoryOptionsDocument,
    "\n  mutation DocumentDownloadUrl($id: ID!) {\n    documentDownloadUrl(id: $id)\n  }\n": typeof types.DocumentDownloadUrlDocument,
    "\n  mutation UpdateDocument($input: UpdateDocumentInput!) {\n    updateDocument(input: $input) { document { id } errors { field message } }\n  }\n": typeof types.UpdateDocumentDocument,
    "\n  mutation RemoveDocument($id: ID!) {\n    removeDocument(id: $id)\n  }\n": typeof types.RemoveDocumentDocument,
    "\n  query DocumentsAdmin($within: Int!) {\n    expiringDocuments(withinDays: $within) {\n      id title expiresOn\n      employee { id fullName }\n      category { id name }\n    }\n    documentCategories(includeInactive: true) { id name employeeCanView managerCanView requiresExpiry isActive }\n  }\n": typeof types.DocumentsAdminDocument,
    "\n  mutation SaveDocumentCategory($input: SaveDocumentCategoryInput!) {\n    saveDocumentCategory(input: $input) { category { id } errors { field message } }\n  }\n": typeof types.SaveDocumentCategoryDocument,
    "\n  mutation UpdateEmployee($input: UpdateEmployeeInput!) {\n    updateEmployee(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n": typeof types.UpdateEmployeeDocument,
    "\n  query JobOptions {\n    legalEntities { id name isActive }\n    departments { id name isActive legalEntity { id } }\n    locations { id name isActive legalEntity { id } }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }\n  }\n": typeof types.JobOptionsDocument,
    "\n  mutation RequestJobChange($input: ChangeJobInput!) {\n    requestJobChange(input: $input) { waitingForApproval errors { field message } }\n  }\n": typeof types.RequestJobChangeDocument,
    "\n  mutation RequestPayChange($input: ChangeCompensationInput!) {\n    requestPayChange(input: $input) { waitingForApproval errors { field message } }\n  }\n": typeof types.RequestPayChangeDocument,
    "\n  mutation ChangeEmployeeJob($input: ChangeJobInput!) {\n    changeEmployeeJob(input: $input) {\n      employee { id }\n      waitingForApproval\n      errors { field message }\n    }\n  }\n": typeof types.ChangeEmployeeJobDocument,
    "\n  mutation ChangeEmployeeCompensation($input: ChangeCompensationInput!) {\n    changeEmployeeCompensation(input: $input) {\n      employee { id }\n      waitingForApproval\n      errors { field message }\n    }\n  }\n": typeof types.ChangeEmployeeCompensationDocument,
    "\n  mutation ChangeEmployeeStatus($input: ChangeStatusInput!) {\n    changeEmployeeStatus(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n": typeof types.ChangeEmployeeStatusDocument,
    "\n  mutation SaveEmergencyContact($input: EmergencyContactInput!) {\n    saveEmergencyContact(input: $input) { contact { id } errors { field message } }\n  }\n": typeof types.SaveEmergencyContactDocument,
    "\n  mutation DeleteEmergencyContact($id: ID!) {\n    deleteEmergencyContact(id: $id)\n  }\n": typeof types.DeleteEmergencyContactDocument,
    "\n  mutation RevealPrivateDetails($employeeId: ID!) {\n    revealPrivateDetails(employeeId: $employeeId) { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }\n  }\n": typeof types.RevealPrivateDetailsDocument,
    "\n  mutation SavePrivateDetails($input: PrivateDetailsInput!) {\n    savePrivateDetails(input: $input) { details { masked } errors { field message } }\n  }\n": typeof types.SavePrivateDetailsDocument,
    "\n  mutation SetEmployeeCustomValues($employeeId: ID!, $values: JSON!) {\n    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }\n  }\n": typeof types.SetEmployeeCustomValuesDocument,
    "\n  query MyChangeRequests {\n    myChangeRequests { id status note createdAt decidedAt decidedBy lines { field label current requested } }\n  }\n": typeof types.MyChangeRequestsDocument,
    "\n  mutation UpdateMyDetails($input: MyDetailsInput!) {\n    updateMyDetails(input: $input) { applied request { id } errors { field message } }\n  }\n": typeof types.UpdateMyDetailsDocument,
    "\n  mutation CancelChangeRequest($id: ID!) {\n    cancelChangeRequest(id: $id) { request { id status } errors { field message } }\n  }\n": typeof types.CancelChangeRequestDocument,
    "\n  fragment ClaimRowFields on ExpenseClaim {\n    id title employeeId employeeName department currency total status stage approverName submittedAt approvedAt paidAt payVia\n    paymentReference payrollPeriod linesCount flags mine canDecide canPay createdAt\n  }\n": typeof types.ClaimRowFieldsFragmentDoc,
    "\n  query WidgetFilters {\n    widgetFilters { key label options { value label } }\n  }\n": typeof types.WidgetFiltersDocument,
    "\n  query PendingTimeOff($filter: WidgetFilter) {\n    pendingTimeOff(filter: $filter) {\n      id approverName startDate endDate days leaveType submittedAt urgent\n      person { id fullName photoUrl }\n    }\n  }\n": typeof types.PendingTimeOffDocument,
    "\n  query TimeOffUsedWidget($leaveTypeId: ID!, $filter: WidgetFilter) {\n    timeOffUsed(leaveTypeId: $leaveTypeId, filter: $filter) {\n      total people\n      months { month value }\n      previousYear { month value }\n    }\n  }\n": typeof types.TimeOffUsedWidgetDocument,
    "\n  query TimeOffUsedTypes {\n    leaveTypes { id name }\n  }\n": typeof types.TimeOffUsedTypesDocument,
    "\n  query LocationWidget($filter: WidgetFilter) {\n    locationBreakdown(filter: $filter) {\n      total\n      current { label value }\n      history { month values { label value } }\n    }\n  }\n": typeof types.LocationWidgetDocument,
    "\n  query PayRaiseWidget($filter: WidgetFilter) {\n    withoutPayRaise(filter: $filter) {\n      count\n      people { hireDate lastRaise amount currency person { id fullName jobTitle } }\n    }\n  }\n": typeof types.PayRaiseWidgetDocument,
    "\n  query MyReminders($employeeId: ID) {\n    myReminders(employeeId: $employeeId) { id text dueOn doneAt employee { id fullName } }\n  }\n": typeof types.MyRemindersDocument,
    "\n  mutation CreateReminder($input: ReminderInput!) { createReminder(input: $input) { reminder { id } errors { field message } } }\n": typeof types.CreateReminderDocument,
    "\n  mutation SnoozeReminder($id: ID!, $dueOn: Date) { updateReminder(id: $id, dueOn: $dueOn) { reminder { id dueOn } errors { message } } }\n": typeof types.SnoozeReminderDocument,
    "\n  mutation CompleteReminder($id: ID!, $done: Boolean!) { completeReminder(id: $id, done: $done) { reminder { id doneAt } errors { message } } }\n": typeof types.CompleteReminderDocument,
    "\n  mutation DeleteReminder($id: ID!) { deleteReminder(id: $id) }\n": typeof types.DeleteReminderDocument,
    "\n  query HomeData {\n    home {\n      setup { percent steps { key label why href done group } }\n      myProfile { percent missing { key label tab critical why } }\n      dataGaps { key label why count people { id fullName jobTitle photoUrl } }\n      celebrations { kind date years person { id fullName jobTitle photoUrl } }\n      newHires { hireDate person { id fullName jobTitle photoUrl } }\n      myStuff { trainings certifications certificationsExpiring benefits openTasks }\n      directReports {\n        notes outToday department location timezone workEmail workPhone workPhoneExt\n        events { kind label date }\n        person { id fullName jobTitle photoUrl }\n      }\n      insights {\n        months { month headcount additions terminations voluntary involuntary other turnoverRate }\n        headcount change changePercent additions terminations turnoverRate\n        byLocation { label value } byDepartment { label value } byEmploymentType { label value }\n        byGender { label value } byAge { label value } benefitEnrollments { label value }\n        expiringCertifications { name people soonest }\n        pendingUrgent pendingOther withoutPayRaise\n        onboarding { inProgress withOverdue starting { date people { id fullName jobTitle photoUrl } } }\n      }\n    }\n    announcements(limit: 20) { id title body authorName publishedAt pinned }\n    companyLinks { id group label url }\n    homeLayout { key hidden }\n    dismissedFeed\n  }\n": typeof types.HomeDataDocument,
    "\n  query ProjectedLeave($leaveTypeId: ID!, $on: Date!) {\n    projectedLeaveBalance(leaveTypeId: $leaveTypeId, on: $on) { balance pending available }\n  }\n": typeof types.ProjectedLeaveDocument,
    "\n  query HomeApprovals {\n    leaveApprovals { id startDate endDate days createdAt canDecide employee { id fullName photoUrl } leaveType { name color } }\n  }\n": typeof types.HomeApprovalsDocument,
    "\n  query HomeChanges {\n    pendingChangeRequests { id employeeId employeeName createdAt canDecide }\n  }\n": typeof types.HomeChangesDocument,
    "\n  mutation HomeDecideLeave($input: DecideLeaveInput!) {\n    decideLeave(input: $input) { request { id status } errors { field message } }\n  }\n": typeof types.HomeDecideLeaveDocument,
    "\n  mutation DismissFeedItem($key: String!) {\n    dismissFeedItem(key: $key)\n  }\n": typeof types.DismissFeedItemDocument,
    "\n  mutation SaveAnnouncement($input: AnnouncementInput!) {\n    saveAnnouncement(input: $input) { announcement { id } errors { field message } }\n  }\n": typeof types.SaveAnnouncementDocument,
    "\n  mutation DeleteAnnouncement($id: ID!) {\n    deleteAnnouncement(id: $id)\n  }\n": typeof types.DeleteAnnouncementDocument,
    "\n  query HomeWhosOut($day: Date!) {\n    leaveCalendar(start: $day, end: $day) { absences { requestId status employee { id fullName photoUrl } leaveType { name } } }\n  }\n": typeof types.HomeWhosOutDocument,
    "\n  mutation SaveCompanyLinks($links: [CompanyLinkInput!]!) {\n    saveCompanyLinks(links: $links) { links { id } errors { field message } }\n  }\n": typeof types.SaveCompanyLinksDocument,
    "\n  query HomeHolidays($year: Int!, $next: Int!) {\n    thisYear: publicHolidays(year: $year) { id name date location { name } }\n    nextYear: publicHolidays(year: $next) { id name date location { name } }\n  }\n": typeof types.HomeHolidaysDocument,
    "\n  query EmployeeLeave($employeeId: ID) {\n    employeeLeave(employeeId: $employeeId) {\n      employee { id fullName }\n      balances {\n        leaveType { id name color tracksBalance allowHalfDays isPaid }\n        policyName entitlement balance pending available takenThisYear\n      }\n      requests {\n        id startDate endDate halfDay days reason status createdAt canCancel canDecide\n        leaveType { id name color }\n        approvals { level status note overridden actedBy actedAt approver { id fullName } }\n      }\n      ledger { id date kind amount reason leaveType { name } }\n    }\n  }\n": typeof types.EmployeeLeaveDocument,
    "\n  mutation CancelLeave($id: ID!) {\n    cancelLeave(id: $id) {\n      request { id status }\n      errors { field message }\n    }\n  }\n": typeof types.CancelLeaveDocument,
    "\n  query LeaveQuote($leaveTypeId: ID!, $startDate: Date!, $endDate: Date!, $halfDay: Boolean!, $employeeId: ID) {\n    leaveQuote(leaveTypeId: $leaveTypeId, startDate: $startDate, endDate: $endDate, halfDay: $halfDay, employeeId: $employeeId) {\n      days available availableAfter\n      errors { field message }\n    }\n  }\n": typeof types.LeaveQuoteDocument,
    "\n  mutation RequestLeave($input: RequestLeaveInput!) {\n    requestLeave(input: $input) {\n      request { id status }\n      errors { field message }\n    }\n  }\n": typeof types.RequestLeaveDocument,
    "\n  mutation AdjustLeaveBalance($input: AdjustLeaveInput!) {\n    adjustLeaveBalance(input: $input) {\n      balance { balance }\n      errors { field message }\n    }\n  }\n": typeof types.AdjustLeaveBalanceDocument,
    "\n  query PayrollLoans {\n    loans { id employeeId employeeName kind amount instalment firstDeduction reason status outstanding repaid }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }\n  }\n": typeof types.PayrollLoansDocument,
    "\n  mutation SaveLoan($input: LoanInput!) { saveLoan(input: $input) { loan { id } errors { field message } } }\n": typeof types.SaveLoanDocument,
    "\n  mutation CloseLoan($id: ID!, $repaid: Boolean!) { closeLoan(id: $id, repaid: $repaid) { id status } }\n": typeof types.CloseLoanDocument,
    "\n  query MyLoans { myLoans { id kind amount outstanding status } }\n": typeof types.MyLoansDocument,
    "\n  query PeopleList($filter: EmployeeFilter, $first: Int, $after: String, $sort: String, $descending: Boolean!) {\n    employees(filter: $filter, first: $first, after: $after, sort: $sort, descending: $descending) {\n      totalCount\n      pageInfo { hasNextPage endCursor }\n      nodes {\n        id employeeNumber firstName lastName preferredName fullName photoUrl status employmentType hireDate\n        workEmail workPhone workPhoneExt phone gender dateOfBirth\n        jobTitle { name } department { name } location { name } legalEntity { name } grade { name } manager { fullName }\n      }\n    }\n  }\n": typeof types.PeopleListDocument,
    "\n  query PeopleFilterOptions {\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    teams { id name isActive }\n    employeeViews { id name filter columns }\n  }\n": typeof types.PeopleFilterOptionsDocument,
    "\n  mutation SavePeopleView($input: EmployeeViewInput!) {\n    saveEmployeeView(input: $input) { view { id name } errors { field message } }\n  }\n": typeof types.SavePeopleViewDocument,
    "\n  mutation DeletePeopleView($id: ID!) {\n    deleteEmployeeView(id: $id)\n  }\n": typeof types.DeletePeopleViewDocument,
    "\n  query PowerEditPeople($filter: EmployeeFilter, $first: Int, $after: String) {\n    employees(filter: $filter, first: $first, after: $after, sort: \"name\") {\n      totalCount\n      pageInfo { hasNextPage endCursor }\n      nodes {\n        id employeeNumber firstName middleName lastName preferredName fullName photoUrl status employmentType\n        workEmail personalEmail phone workPhone workPhoneExt dateOfBirth gender maritalStatus\n        jobTitle { id name } department { id name } location { id name } legalEntity { id name } grade { id name } manager { id fullName }\n        personal { nationality linkedinUrl homePhone addressLine1 addressLine2 city state postalCode country }\n        customValues { field { key } value }\n      }\n    }\n  }\n": typeof types.PowerEditPeopleDocument,
    "\n  query PowerEditLookups {\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    customFields { key name fieldType choices }\n    orgChart { id fullName }\n  }\n": typeof types.PowerEditLookupsDocument,
    "\n  mutation PowerEdit($input: PowerEditInput!) {\n    powerEdit(input: $input) { employeeId fullName ok errors { field message } }\n  }\n": typeof types.PowerEditDocument,
    "\n  query PeopleOrg {\n    orgChart {\n      id fullName jobTitle departmentId department locationId location legalEntityId legalEntity place timezone\n      workEmail workPhone workPhoneExt photoUrl managerId managerName directReportCount outUntil employeeNumber hireDate mobile linkedinUrl twitter facebook\n    }\n  }\n": typeof types.PeopleOrgDocument,
    "\n  mutation SaveReviewCycle($input: ReviewCycleInput!) { saveReviewCycle(input: $input) { cycle { id } errors { field message } } }\n": typeof types.SaveReviewCycleDocument,
    "\n  query PerformancePeopleSearch($search: String) { directory(search: $search, first: 8) { nodes { id fullName jobTitle } } }\n": typeof types.PerformancePeopleSearchDocument,
    "\n  fragment GoalFields on Goal {\n    id title description employeeId employeeName parentId parentTitle startDate dueDate progress status supporting canEdit updatedAt\n    keyResults { id title startValue targetValue currentValue unit progress }\n  }\n": typeof types.GoalFieldsFragmentDoc,
    "\n  fragment ReviewRowFields on ReviewSummary {\n    id cycleName cycleStatus employeeName department managerName status overallRating calibratedRating scale myRole myResponseId myResponseDone due\n    selfDone managerDone\n  }\n": typeof types.ReviewRowFieldsFragmentDoc,
    "\n  query EmployeeBenefits($employeeId: ID!) {\n    employeeBenefits(employeeId: $employeeId) {\n      id status startDate endDate memberNumber coverage dependants note\n      plan { id name kind provider employeeRate employerRate basis statutory }\n    }\n    benefitPlans { id name kind provider employeeRate employerRate basis statutory isActive }\n  }\n": typeof types.EmployeeBenefitsDocument,
    "\n  mutation SaveBenefitEnrollment($input: SaveEnrollmentInput!) {\n    saveBenefitEnrollment(input: $input) { enrollment { id } errors { field message } }\n  }\n": typeof types.SaveBenefitEnrollmentDocument,
    "\n  mutation DeleteBenefitEnrollment($id: ID!) {\n    deleteBenefitEnrollment(id: $id)\n  }\n": typeof types.DeleteBenefitEnrollmentDocument,
    "\n  mutation SetBonusTarget($input: BonusTargetInput!) {\n    setBonusTarget(input: $input) { employee { id } errors { field message } }\n  }\n": typeof types.SetBonusTargetDocument,
    "\n  mutation AddEmployeeNote($employeeId: ID!, $body: String!, $remindOn: Date) {\n    addEmployeeNote(employeeId: $employeeId, body: $body, remindOn: $remindOn) { note { id } errors { field message } }\n  }\n": typeof types.AddEmployeeNoteDocument,
    "\n  mutation DeleteEmployeeNote($id: ID!) {\n    deleteEmployeeNote(id: $id)\n  }\n": typeof types.DeleteEmployeeNoteDocument,
    "\n  query EmployeeChecklist($employeeId: ID!, $kind: ChecklistKind!) {\n    checklist(employeeId: $employeeId, kind: $kind) {\n      startDate\n      tasks { id title description category assignee dueDate completedAt completedByName canComplete }\n    }\n  }\n": typeof types.EmployeeChecklistDocument,
    "\n  mutation StartChecklist($employeeId: ID!, $kind: ChecklistKind!, $startDate: Date) {\n    startChecklist(employeeId: $employeeId, kind: $kind, startDate: $startDate) { tasks { id } errors { field message } }\n  }\n": typeof types.StartChecklistDocument,
    "\n  mutation SetTaskDone($id: ID!, $done: Boolean!) {\n    setTaskDone(id: $id, done: $done) { task { id completedAt } errors { field message } }\n  }\n": typeof types.SetTaskDoneDocument,
    "\n  mutation AddEmployeeTask($input: AddTaskInput!) {\n    addEmployeeTask(input: $input) { task { id } errors { field message } }\n  }\n": typeof types.AddEmployeeTaskDocument,
    "\n  mutation DeleteEmployeeTask($id: ID!) {\n    deleteEmployeeTask(id: $id)\n  }\n": typeof types.DeleteEmployeeTaskDocument,
    "\n  mutation SaveLayoutCustomField($input: SaveCustomFieldInput!) {\n    saveCustomField(input: $input) { field { id key name } errors { field message } }\n  }\n": typeof types.SaveLayoutCustomFieldDocument,
    "\n  mutation SaveLayoutCustomTable($input: SaveCustomTableInput!) {\n    saveCustomTable(input: $input) { table { id key name } errors { field message } }\n  }\n": typeof types.SaveLayoutCustomTableDocument,
    "\n  mutation UpdateEmployeeFields($input: UpdateEmployeeInput!) {\n    updateEmployee(input: $input) { employee { id } errors { field message } }\n  }\n": typeof types.UpdateEmployeeFieldsDocument,
    "\n  mutation UpdateMyFields($input: MyDetailsInput!) {\n    updateMyDetails(input: $input) { applied request { id } errors { field message } }\n  }\n": typeof types.UpdateMyFieldsDocument,
    "\n  mutation SetCustomFields($employeeId: ID!, $values: JSON!) {\n    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }\n  }\n": typeof types.SetCustomFieldsDocument,
    "\n  query LeaveHistory($employeeId: ID, $leaveTypeId: ID!, $year: Int) {\n    leaveHistory(employeeId: $employeeId, leaveTypeId: $leaveTypeId, year: $year) {\n      years\n      rows { id date kind description detail used earned balance }\n    }\n  }\n": typeof types.LeaveHistoryDocument,
    "\n  mutation SaveTableRow($input: TableRowInput!) {\n    saveTableRow(input: $input) { row { id } errors { field message } }\n  }\n": typeof types.SaveTableRowDocument,
    "\n  mutation DeleteTableRow($id: ID!) {\n    deleteTableRow(id: $id)\n  }\n": typeof types.DeleteTableRowDocument,
    "\n  query TrainingStatus($id: ID!) {\n    trainingStatus(employeeId: $id) { courseId course lastCompleted dueOn state }\n  }\n": typeof types.TrainingStatusDocument,
    "\n  query EmployeeProfile($id: ID!) {\n    employee(id: $id) {\n      id\n      completeness { percent missing { key label tab critical why } }\n      employeeNumber\n      fieldAccess\n      fullName\n      firstName\n      middleName\n      lastName\n      preferredName\n      workEmail\n      personalEmail\n      phone\n      workPhone\n      workPhoneExt\n      dateOfBirth\n      gender\n      maritalStatus\n      personal { nationality pronouns linkedinUrl twitter facebook homePhone addressLine1 addressLine2 city state postalCode country }\n      photoUrl\n      status\n      hireDate\n      probationEndDate\n      terminationDate\n      terminationReason\n      employmentType\n      archivedAt\n      legalEntity { id name }\n      department { id name }\n      location { id name city country timezone }\n      jobTitle { id name description }\n      grade { id name }\n      manager { id fullName jobTitle { name } photoUrl }\n      directReports { id fullName jobTitle { name } }\n      emergencyContacts {\n        id name relationship phone workPhone workPhoneExt homePhone email isPrimary\n        addressLine1 addressLine2 city state postalCode country\n      }\n      privateDetails { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }\n      customValues { value field { id key name fieldType choices helpText hrOnly } }\n      tableRows { id tableKey values createdAt }\n      compensation { amount currency frequency effectiveDate payType paySchedule overtime }\n      compensationHistory { id amount currency frequency effectiveDate reason payType paySchedule overtime comment }\n      bonusTarget { percent amount }\n      statusHistory { id effectiveDate status comment }\n      notes { id body authorName createdAt }\n      employmentHistory {\n        id effectiveDate changeType reason\n        jobTitle { name }\n        department { name }\n        location { name }\n        grade { name }\n        manager { fullName }\n        employmentType\n      }\n    }\n  }\n": typeof types.EmployeeProfileDocument,
    "\n  query ProfileLayout {\n    profileLayout {\n      tabs {\n        key name builtin\n        sections { key title icon items { id kind key label fields } }\n      }\n      library { id kind key label fields }\n    }\n    customTables(includeInactive: true) { id key name hrOnly pay standard isActive columns { key name type choices } }\n    customFields(includeInactive: true) { id key }\n  }\n": typeof types.ProfileLayoutDocument,
    "\n  mutation SaveProfileLayout($config: JSON!) {\n    saveProfileLayout(config: $config) { layout { tabs { key } } errors { field message } }\n  }\n": typeof types.SaveProfileLayoutDocument,
    "\n  query CustomReportOptions {\n    customReportFields { key label category }\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n  }\n": typeof types.CustomReportOptionsDocument,
    "\n  query CustomReportPreview($fields: [String!], $filter: JSON, $showing: String!) {\n    runCustomReport(fields: $fields, filter: $filter, showing: $showing) { chart note rows columns { key label kind } summary { label value } }\n  }\n": typeof types.CustomReportPreviewDocument,
    "\n  mutation SaveCustomReport($input: CustomReportInput!) {\n    saveCustomReport(input: $input) { report { id } errors { field message } }\n  }\n": typeof types.SaveCustomReportDocument,
    "\n  query AccessLevels {\n    roles { id code name description permissions scope isSystem fieldAccess memberCount }\n    permissionCatalog { code description }\n    fieldGroups { key description }\n    members { id fullName email isActive invitePending lastLogin roles { code } }\n    me { user { email } }\n  }\n": typeof types.AccessLevelsDocument,
    "\n  mutation SaveRole($input: SaveRoleInput!) {\n    saveRole(input: $input) { role { id } errors { field message } }\n  }\n": typeof types.SaveRoleDocument,
    "\n  mutation DuplicateRole($id: ID!, $name: String!) {\n    duplicateRole(id: $id, name: $name) { role { id } errors { field message } }\n  }\n": typeof types.DuplicateRoleDocument,
    "\n  mutation DeleteRole($id: ID!) {\n    deleteRole(id: $id)\n  }\n": typeof types.DeleteRoleDocument,
    "\n  query AccountData {\n    dataExports { id status size summary error requestedBy createdAt finishedAt expiresAt }\n    accountClosure { status closesOn requestedAt requestedBy reason graceDays backupDays }\n  }\n": typeof types.AccountDataDocument,
    "mutation RequestDataExport { requestDataExport { id status } }": typeof types.RequestDataExportDocument,
    "mutation DataExportUrl($id: ID!) { dataExportUrl(id: $id) }": typeof types.DataExportUrlDocument,
    "\n  mutation RequestAccountClosure($companyName: String!, $password: String!, $reason: String) {\n    requestAccountClosure(companyName: $companyName, password: $password, reason: $reason) { closure { status closesOn } errors { field message } }\n  }\n": typeof types.RequestAccountClosureDocument,
    "mutation CancelAccountClosure { cancelAccountClosure { closure { status } errors { message } } }": typeof types.CancelAccountClosureDocument,
    "\n  query MyCalendarFeeds { myCalendarFeeds { id kinds url lastUsedAt } }\n": typeof types.MyCalendarFeedsDocument,
    "\n  mutation CreateCalendarFeed($kinds: [String!]!) { createCalendarFeed(kinds: $kinds) { id } }\n": typeof types.CreateCalendarFeedDocument,
    "mutation DeleteCalendarFeed($id: ID!) { deleteCalendarFeed(id: $id) }": typeof types.DeleteCalendarFeedDocument,
    "\n  query ApiKeys { apiKeys { id name prefix readOnly owner createdAt lastUsedAt } }\n": typeof types.ApiKeysDocument,
    "\n  mutation CreateApiKey($name: String!, $readOnly: Boolean!) { createApiKey(name: $name, readOnly: $readOnly) { secret } }\n": typeof types.CreateApiKeyDocument,
    "mutation RevokeApiKey($id: ID!) { revokeApiKey(id: $id) }": typeof types.RevokeApiKeyDocument,
    "query MyEmailPreferences { myEmailPreferences { key label email } }": typeof types.MyEmailPreferencesDocument,
    "\n  mutation SetEmailPreferences($off: [String!]!) { setEmailPreferences(emailOff: $off) { key email } }\n": typeof types.SetEmailPreferencesDocument,
    "\n  query InviteCandidates { inviteCandidates { withoutEmail people { employeeId name email department } } }\n": typeof types.InviteCandidatesDocument,
    "\n  mutation InviteEmployees($ids: [ID!]!) { inviteEmployees(employeeIds: $ids) { invited problems { name message } } }\n": typeof types.InviteEmployeesDocument,
    "\n  query OptionListsAdmin {\n    optionLists { key name }\n    listOptions(includeInactive: true) { id listKey label position isActive }\n  }\n": typeof types.OptionListsAdminDocument,
    "\n  mutation SaveListOption($input: ListOptionInput!) {\n    saveListOption(input: $input) { option { id } errors { field message } }\n  }\n": typeof types.SaveListOptionDocument,
    "\n  mutation ReorderListOptions($ids: [ID!]!) { reorderListOptions(ids: $ids) }\n": typeof types.ReorderListOptionsDocument,
    "\n  mutation DeleteListOption($id: ID!) { deleteListOption(id: $id) }\n": typeof types.DeleteListOptionDocument,
    "\n  query ListChoices($key: ListKey!) {\n    listOptions(listKey: $key) { id label }\n  }\n": typeof types.ListChoicesDocument,
    "\n  query SetupProgress { setupProgress { percent steps { key label why href done group } } }\n": typeof types.SetupProgressDocument,
    "\n  query TeamsAdmin {\n    teams(includeInactive: true) { id name description isActive leadId leadName memberIds memberNames }\n    orgChart { id fullName jobTitle }\n  }\n": typeof types.TeamsAdminDocument,
    "\n  mutation SaveTeam($input: TeamInput!) {\n    saveTeam(input: $input) { team { id } errors { field message } }\n  }\n": typeof types.SaveTeamDocument,
    "\n  mutation DeleteTeam($id: ID!) { deleteTeam(id: $id) }\n": typeof types.DeleteTeamDocument,
    "\n  mutation StartViewAs($id: ID!) {\n    startViewAs(memberId: $id) { permissions }\n  }\n": typeof types.StartViewAsDocument,
    "\n  query EmployeeSnapshot($id: ID!) {\n    employee(id: $id) {\n      id fullName photoUrl employeeNumber workEmail phone workPhone workPhoneExt dateOfBirth\n      hireDate status employmentType\n      jobTitle { name } department { name } grade { name } legalEntity { name }\n      location { name city country }\n      manager { id fullName }\n      directReports { id }\n      employmentHistory { id effectiveDate changeType jobTitle { name } }\n      compensationHistory { id effectiveDate amount currency frequency }\n    }\n  }\n": typeof types.EmployeeSnapshotDocument,
    "\n  query ReportCatalog {\n    reportCatalog { key title description usesRange groupings category favorite lastViewed }\n  }\n": typeof types.ReportCatalogDocument,
    "\n  query CustomReports {\n    customReports { id name description fields filter showing shared ownerName mine favorite lastViewed }\n  }\n": typeof types.CustomReportsDocument,
    "\n  mutation SetFavoriteReport($favorite: Boolean!, $key: String, $customId: ID) {\n    setFavoriteReport(favorite: $favorite, key: $key, customId: $customId)\n  }\n": typeof types.SetFavoriteReportDocument,
    "\n  query Me {\n    me {\n      permissions\n      roles\n      user { id email fullName }\n      employee { id fullName jobTitle { name } }\n      hasPayslips\n      mfaEnabled mfaSetupRequired recoveryCodesLeft\n      viewingAs { name realName startedAt }\n    }\n    tenant {\n      name slug primaryColor country currency logoUrl\n      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads attendanceEnabled expensesEnabled timesheetsEnabled payrollEnabled status closesOn\n    }\n  }\n": typeof types.MeDocument,
};
const documents: Documents = {
    "\n  mutation ChangePassword($current: String!, $new: String!) {\n    changePassword(current: $current, new: $new) { ok errors { field message } }\n  }\n": types.ChangePasswordDocument,
    "\n  mutation StartMfaSetup { startMfaSetup { secret uri qrSvg } }\n": types.StartMfaSetupDocument,
    "\n  mutation ConfirmMfaSetup($code: String!) {\n    confirmMfaSetup(code: $code) { codes errors { field message } }\n  }\n": types.ConfirmMfaSetupDocument,
    "\n  mutation DisableMfa($password: String!) {\n    disableMfa(password: $password) { ok errors { field message } }\n  }\n": types.DisableMfaDocument,
    "\n  mutation NewRecoveryCodes($code: String!) {\n    newRecoveryCodes(code: $code) { codes errors { field message } }\n  }\n": types.NewRecoveryCodesDocument,
    "\n  query MyAttendance {\n    myAttendance(days: 14) {\n      enabled shift shiftStart shiftEnd geofenced\n      clockedIn { id clockIn flags }\n      days { date shift scheduled worked late absent onLeave holiday\n        entries { id clockIn clockOut minutes flags note source }\n        overtime { id minutes status } }\n    }\n  }\n": types.MyAttendanceDocument,
    "\n  mutation ClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id flags } errors { message } } }\n": types.ClockInDocument,
    "\n  mutation ClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id minutes } errors { message } } }\n": types.ClockOutDocument,
    "\n  query AttendanceBoard($date: Date) { attendanceBoard(date: $date) { employeeId employeeName department status clockIn clockOut worked flags } }\n": types.AttendanceBoardDocument,
    "\n  query AttendanceDays($id: ID!, $start: Date!, $end: Date!) {\n    attendanceDays(employeeId: $id, start: $start, end: $end) { date shift scheduled worked late absent onLeave holiday\n      entries { id clockIn clockOut minutes flags note source } overtime { id minutes status } }\n  }\n": types.AttendanceDaysDocument,
    "\n  mutation SaveTimeEntry($input: TimeEntryInput!) { saveTimeEntry(input: $input) { entry { id } errors { field message } } }\n": types.SaveTimeEntryDocument,
    "mutation DeleteTimeEntry($id: ID!) { deleteTimeEntry(id: $id) }": types.DeleteTimeEntryDocument,
    "\n  query OvertimeToDecide { overtimeToDecide { id employeeName date minutes } }\n": types.OvertimeToDecideDocument,
    "\n  mutation DecideOvertime($id: ID!, $approve: Boolean!) { decideOvertime(id: $id, approve: $approve) { id status } }\n": types.DecideOvertimeDocument,
    "\n  mutation ArchiveEmployee($id: ID!) {\n    archiveEmployee(id: $id) { employee { id } errors { field message } }\n  }\n": types.ArchiveEmployeeDocument,
    "\n  mutation SendEmployeePasswordReset($employeeId: ID!) {\n    sendEmployeePasswordReset(employeeId: $employeeId)\n  }\n": types.SendEmployeePasswordResetDocument,
    "\n  query EmployeeAccess($id: ID!) {\n    employee(id: $id) { id access { email roles isActive invitePending } }\n  }\n": types.EmployeeAccessDocument,
    "\n  mutation RemoveEmployeePhoto($employeeId: ID!) {\n    removeEmployeePhoto(employeeId: $employeeId)\n  }\n": types.RemoveEmployeePhotoDocument,
    "\n  mutation HireEmployee($input: HireEmployeeInput!) {\n    hireEmployee(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n": types.HireEmployeeDocument,
    "\n  query MyDirectoryAccess { myDirectoryAccess { directory orgChart } }\n": types.MyDirectoryAccessDocument,
    "\n  query PendingChanges {\n    pendingChangeRequests { id employeeId employeeName createdAt canDecide lines { field label current requested } }\n  }\n": types.PendingChangesDocument,
    "\n  mutation DecideChangeRequest($id: ID!, $approve: Boolean!, $note: String) {\n    decideChangeRequest(id: $id, approve: $approve, note: $note) { request { id status } errors { field message } }\n  }\n": types.DecideChangeRequestDocument,
    "\n  query ExpenseClaim($id: ID!) {\n    expenseClaim(id: $id) {\n      ...ClaimRowFields\n      lines { id categoryId categoryName date description amount distanceKm receiptName receiptUrl flags }\n      actions { id actor action stage note createdAt }\n    }\n    expenseCategories { id name description limitPerItem limitPerMonth receiptRequired mileageRate }\n    expenseSettings { receiptOver maxAgeDays payVia }\n  }\n": types.ExpenseClaimDocument,
    "mutation RenameExpenseClaim($id: ID!, $title: String!) { renameExpenseClaim(id: $id, title: $title) { claim { id title } errors { message } } }": types.RenameExpenseClaimDocument,
    "mutation DeleteExpenseLine($id: ID!) { deleteExpenseLine(id: $id) { claim { id total } errors { message } } }": types.DeleteExpenseLineDocument,
    "mutation SubmitExpenseClaim($id: ID!) { submitExpenseClaim(id: $id) { claim { id status } errors { message } } }": types.SubmitExpenseClaimDocument,
    "mutation WithdrawExpenseClaim($id: ID!) { withdrawExpenseClaim(id: $id) { claim { id status } errors { message } } }": types.WithdrawExpenseClaimDocument,
    "\n  mutation DecideExpenseClaim($id: ID!, $action: String!, $note: String!) {\n    decideExpenseClaim(id: $id, action: $action, note: $note) { claim { id status stage } errors { field message } }\n  }\n": types.DecideExpenseClaimDocument,
    "query MyExpenseClaims { myExpenseClaims { ...ClaimRowFields } expenseSettings { enabled payVia } }": types.MyExpenseClaimsDocument,
    "query ExpensesToApprove { expensesToApprove { ...ClaimRowFields } }": types.ExpensesToApproveDocument,
    "\n  query ExpenseClaims($status: String, $search: String!) { expenseClaims(status: $status, search: $search) { ...ClaimRowFields } }\n": types.ExpenseClaimsDocument,
    "\n  mutation CreateExpenseClaim($title: String!) { createExpenseClaim(title: $title) { claim { id } errors { field message } } }\n": types.CreateExpenseClaimDocument,
    "mutation MarkExpenseClaimsPaid($ids: [ID!]!, $reference: String!) { markExpenseClaimsPaid(ids: $ids, reference: $reference) }": types.MarkExpenseClaimsPaidDocument,
    "\n  query CompanyFolders {\n    companyFolders { id name fileCount }\n  }\n": types.CompanyFoldersDocument,
    "\n  query CompanyFiles($folderId: ID, $search: String) {\n    companyFiles(folderId: $folderId, search: $search) {\n      id title originalName contentType size shared folderId uploadedBy createdAt requiresAcknowledgement acknowledgedByMe acknowledgedCount\n    }\n  }\n": types.CompanyFilesDocument,
    "\n  mutation SaveCompanyFolder($name: String!, $id: ID) {\n    saveCompanyFolder(name: $name, id: $id) { folder { id name } errors { field message } }\n  }\n": types.SaveCompanyFolderDocument,
    "\n  mutation DeleteCompanyFolder($id: ID!) {\n    deleteCompanyFolder(id: $id)\n  }\n": types.DeleteCompanyFolderDocument,
    "\n  mutation UpdateCompanyFile($input: UpdateCompanyFileInput!) {\n    updateCompanyFile(input: $input) { file { id } errors { field message } }\n  }\n": types.UpdateCompanyFileDocument,
    "\n  mutation RemoveCompanyFiles($ids: [ID!]!) {\n    removeCompanyFiles(ids: $ids)\n  }\n": types.RemoveCompanyFilesDocument,
    "\n  mutation AcknowledgeCompanyFile($id: ID!) { acknowledgeCompanyFile(id: $id) { id acknowledgedByMe } }\n": types.AcknowledgeCompanyFileDocument,
    "\n  query FileAcknowledgements($id: ID!) { fileAcknowledgements(id: $id) { name email acknowledgedAt } }\n": types.FileAcknowledgementsDocument,
    "\n  mutation CompanyFileDownloadUrl($id: ID!) {\n    companyFileDownloadUrl(id: $id)\n  }\n": types.CompanyFileDownloadUrlDocument,
    "\n  query HomeExpiring {\n    expiringDocuments(withinDays: 30) { id }\n  }\n": types.HomeExpiringDocument,
    "\n  query HomeMyPhoto($id: ID!) {\n    employee(id: $id) { id photoUrl }\n  }\n": types.HomeMyPhotoDocument,
    "\n  mutation SaveHomeLayout($widgets: JSON!) {\n    saveHomeLayout(widgets: $widgets) { key hidden }\n  }\n": types.SaveHomeLayoutDocument,
    "\n  mutation AddMeAsEmployee { addMeAsEmployee { employee { id } errors { message } } }\n": types.AddMeAsEmployeeDocument,
    "\n  query LeaveApprovals($everyone: Boolean!) {\n    leaveApprovals(everyone: $everyone) {\n      id startDate endDate halfDay days reason status createdAt canDecide decideAsOverride\n      employee { id fullName }\n      leaveType { id name color }\n      waitingFor { id fullName }\n      approvals { level status note overridden actedBy actedAt approver { id fullName } }\n    }\n    myDelegations { id startDate endDate delegator { id fullName } delegate { id fullName } }\n  }\n": types.LeaveApprovalsDocument,
    "\n  mutation DecideLeave($input: DecideLeaveInput!) {\n    decideLeave(input: $input) {\n      request { id status }\n      errors { field message }\n    }\n  }\n": types.DecideLeaveDocument,
    "\n  query DelegatePeople {\n    employees(filter: { statuses: [ACTIVE, PROBATION] }, first: 100) { nodes { id fullName } }\n  }\n": types.DelegatePeopleDocument,
    "\n  mutation DelegateApprovals($input: DelegateInput!) {\n    delegateApprovals(input: $input) { delegation { id } errors { field message } }\n  }\n": types.DelegateApprovalsDocument,
    "\n  mutation RevokeDelegation($id: ID!) {\n    revokeDelegation(id: $id) { delegation { id } errors { field message } }\n  }\n": types.RevokeDelegationDocument,
    "\n  query LeaveCalendar($start: Date!, $end: Date!, $departmentId: ID) {\n    leaveCalendar(start: $start, end: $end, departmentId: $departmentId) {\n      absences {\n        requestId startDate endDate halfDay status\n        employee { id fullName }\n        leaveType { id name color }\n      }\n      holidays { id name date location { name } }\n    }\n  }\n": types.LeaveCalendarDocument,
    "\n  query CalendarDepartments {\n    departments { id name isActive }\n  }\n": types.CalendarDepartmentsDocument,
    "\n  query UpcomingHolidays($year: Int!, $next: Int!) {\n    thisYear: publicHolidays(year: $year) { id name date location { name } }\n    nextYear: publicHolidays(year: $next) { id name date location { name } }\n  }\n": types.UpcomingHolidaysDocument,
    "\n  query PayrollHome {\n    payrollRuns { id payGroup currency periodStart periodEnd payDate status offCycle headcount gross net warnings published canApprove }\n    payGroups { id name frequency isActive supported }\n  }\n": types.PayrollHomeDocument,
    "\n  query PayrollPeople {\n    payrollPeople { employeeId payGroupId taxState pensionProvider socialSecurityNumber nhfNumber contributesNhf pensionExempt annualRent annualLifeInsurance voluntaryPensionPercent }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName employeeNumber department { name } } }\n    payGroups { id name isActive }\n    payComponents { id name kind role isActive }\n  }\n": types.PayrollPeopleDocument,
    "\n  mutation CreatePayrollRun($group: ID!, $start: Date!, $offCycle: Boolean!, $note: String!) {\n    createPayrollRun(payGroupId: $group, periodStart: $start, offCycle: $offCycle, note: $note) { run { id } errors { field message } }\n  }\n": types.CreatePayrollRunDocument,
    "\n  mutation AssignPayGroup($ids: [ID!]!, $group: ID) { assignPayGroup(employeeIds: $ids, payGroupId: $group) }\n": types.AssignPayGroupDocument,
    "\n  mutation SavePayrollProfile($input: PayrollProfileInput!) { savePayrollProfile(input: $input) { profile { employeeId } errors { field message } } }\n": types.SavePayrollProfileDocument,
    "\n  query PayItems($id: ID!) { payItems(employeeId: $id) { id componentId component kind amount startDate endDate note } }\n": types.PayItemsDocument,
    "\n  mutation SavePayItem($input: PayItemInput!) { savePayItem(input: $input) { item { id } errors { field message } } }\n": types.SavePayItemDocument,
    "mutation DeletePayItem($id: ID!) { deletePayItem(id: $id) }": types.DeletePayItemDocument,
    "\n  query PayrollRunDetail($id: ID!) {\n    payrollRun(id: $id) {\n      id payGroup currency periodStart periodEnd payDate status offCycle note createdBy submittedBy approvedBy published\n      headcount gross deductions net employerCost warnings canApprove\n      payslips { id employeeName employeeNumber gross totalDeductions net employerCost lines workings warnings daysPaid daysInPeriod rulePack }\n      variance { employeeId employeeName net previous change percent flag }\n    }\n  }\n": types.PayrollRunDetailDocument,
    "\n  mutation PayrollRunAction($id: ID!, $recalc: Boolean!, $submit: Boolean!, $approve: Boolean!, $publish: Boolean!, $paid: Boolean!, $cancel: Boolean!) {\n    recalculatePayrollRun(id: $id) @include(if: $recalc) { errors { message } }\n    submitPayrollRun(id: $id) @include(if: $submit) { errors { message } }\n    approvePayrollRun(id: $id) @include(if: $approve) { errors { message } }\n    publishPayslips(id: $id) @include(if: $publish) { errors { message } }\n    markPayrollPaid(id: $id) @include(if: $paid) { errors { message } }\n    cancelPayrollRun(id: $id) @include(if: $cancel) { errors { message } }\n  }\n": types.PayrollRunActionDocument,
    "\n  mutation SendBackPayrollRun($id: ID!, $note: String!) { sendBackPayrollRun(id: $id, note: $note) { errors { message } } }\n": types.SendBackPayrollRunDocument,
    "\n  query MyPayslips {\n    myPayslips { id periodStart periodEnd payDate currency gross totalDeductions net lines }\n  }\n": types.MyPayslipsDocument,
    "\n  query CycleReviews($id: ID!) {\n    reviewCycle(id: $id) { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds\n      people selfDone managerDone shared }\n    cycleReviews(cycleId: $id) { ...ReviewRowFields calibrationNote }\n    reviewTemplates { id name isActive }\n    departments { id name }\n  }\n": types.CycleReviewsDocument,
    "mutation LaunchReviewCycle($id: ID!) { launchReviewCycle(id: $id) { cycle { id status } errors { message } } }": types.LaunchReviewCycleDocument,
    "mutation CloseReviewCycle($id: ID!) { closeReviewCycle(id: $id) { cycle { id status } errors { message } } }": types.CloseReviewCycleDocument,
    "mutation DeleteReviewCycle($id: ID!) { deleteReviewCycle(id: $id) }": types.DeleteReviewCycleDocument,
    "\n  mutation CalibrateFromCycle($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { id calibratedRating calibrationNote } }\n": types.CalibrateFromCycleDocument,
    "\n  query Goals($employeeId: ID) {\n    goals(employeeId: $employeeId) { ...GoalFields }\n    company: goals { ...GoalFields }\n    teamGoals { ...GoalFields }\n    myReports { id name jobTitle direct }\n  }\n": types.GoalsDocument,
    "query AlignableGoals($employeeId: ID) { alignableGoals(employeeId: $employeeId) { id title employeeName } }": types.AlignableGoalsDocument,
    "query GoalUpdates($id: ID!) { goal(id: $id) { id updates { id author progress status note createdAt } } }": types.GoalUpdatesDocument,
    "\n  mutation SaveGoal($input: GoalInput!) { saveGoal(input: $input) { goal { ...GoalFields } errors { field message } } }\n": types.SaveGoalDocument,
    "\n  mutation CheckInGoal($input: GoalCheckInInput!) { checkInGoal(input: $input) { goal { ...GoalFields } errors { field message } } }\n": types.CheckInGoalDocument,
    "mutation DeleteGoal($id: ID!) { deleteGoal(id: $id) }": types.DeleteGoalDocument,
    "\n  query MyReviews { myReviews { ...ReviewRowFields } teamReviews { ...ReviewRowFields } }\n": types.MyReviewsDocument,
    "\n  query Feedback($employeeId: ID) {\n    feedback(employeeId: $employeeId) { id giverName recipientId recipientName body private mine createdAt }\n    myReports { id name direct }\n  }\n": types.FeedbackDocument,
    "\n  mutation GiveFeedback($recipientId: ID!, $body: String!, $private: Boolean) {\n    giveFeedback(recipientId: $recipientId, body: $body, private: $private) { feedback { id } errors { field message } }\n  }\n": types.GiveFeedbackDocument,
    "mutation DeleteFeedback($id: ID!) { deleteFeedback(id: $id) }": types.DeleteFeedbackDocument,
    "\n  query OneOnOnes { oneOnOnes { id managerId managerName employeeId employeeName date agenda notes privateNotes actionItems myRole } myReports { id name direct } }\n": types.OneOnOnesDocument,
    "\n  mutation SaveOneOnOne($input: OneOnOneInput!) { saveOneOnOne(input: $input) { oneOnOne { id } errors { field message } } }\n": types.SaveOneOnOneDocument,
    "mutation DeleteOneOnOne($id: ID!) { deleteOneOnOne(id: $id) }": types.DeleteOneOnOneDocument,
    "\n  query ReviewCycles {\n    reviewCycles { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds\n      people selfDone managerDone shared }\n    reviewTemplates { id name isActive }\n    departments { id name }\n  }\n": types.ReviewCyclesDocument,
    "\n  query Review($id: ID!) {\n    review(id: $id) {\n      review { ...ReviewRowFields calibrationNote }\n      questions\n      responses { id role authorId authorName answers submittedAt declinedAt mine }\n      peers { id name status }\n      sharedAt acknowledgedAt employeeComment periodStart periodEnd includePeers canManage canCalibrate isEmployee\n    }\n  }\n": types.ReviewDocument,
    "\n  mutation SaveReviewResponse($id: ID!, $answers: JSON!, $submit: Boolean) {\n    saveReviewResponse(id: $id, answers: $answers, submit: $submit) { response { id submittedAt } errors { field message } }\n  }\n": types.SaveReviewResponseDocument,
    "mutation DeclinePeerReview($id: ID!) { declinePeerReview(id: $id) }": types.DeclinePeerReviewDocument,
    "\n  mutation RequestPeerReviews($reviewId: ID!, $employeeIds: [ID!]!) { requestPeerReviews(reviewId: $reviewId, employeeIds: $employeeIds) { peers { id } } }\n": types.RequestPeerReviewsDocument,
    "mutation ShareReview($id: ID!) { shareReview(id: $id) { sharedAt } }": types.ShareReviewDocument,
    "mutation AcknowledgeReview($id: ID!, $comment: String!) { acknowledgeReview(id: $id, comment: $comment) { acknowledgedAt } }": types.AcknowledgeReviewDocument,
    "\n  mutation CalibrateReview($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { calibratedRating } }\n": types.CalibrateReviewDocument,
    "\n  query RunReport($key: String!, $params: ReportParams) {\n    runReport(key: $key, params: $params) {\n      title chart note start end rows\n      columns { key label kind }\n      summary { label value }\n    }\n  }\n": types.RunReportDocument,
    "\n  query ReportFilterOptions {\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    departments { id name isActive }\n  }\n": types.ReportFilterOptionsDocument,
    "\n  query RunCustomReport($id: ID!) {\n    runCustomReport(id: $id) { title chart note rows columns { key label kind } summary { label value } }\n  }\n": types.RunCustomReportDocument,
    "\n  mutation DeleteCustomReport($id: ID!) {\n    deleteCustomReport(id: $id)\n  }\n": types.DeleteCustomReportDocument,
    "\n  query EmailAlertsAdmin {\n    emailAlerts { id name kind field daysBefore recipients enabled lastSentOn }\n    alertOptions { kinds { key label } dateFields { key label } recipientTypes { key label } }\n    roles { code name }\n    members { id fullName email isActive }\n  }\n": types.EmailAlertsAdminDocument,
    "\n  mutation SaveEmailAlert($input: EmailAlertInput!) {\n    saveEmailAlert(input: $input) { alert { id } errors { field message } }\n  }\n": types.SaveEmailAlertDocument,
    "mutation DeleteEmailAlert($id: ID!) { deleteEmailAlert(id: $id) }": types.DeleteEmailAlertDocument,
    "mutation SendEmailAlertNow($id: ID!) { sendEmailAlertNow(id: $id) }": types.SendEmailAlertNowDocument,
    "\n  query ApprovalsSettings {\n    approvalChains { kind name enabled steps }\n    approvalStepTypes { key label }\n    roles { code name }\n    members { id fullName email isActive }\n  }\n": types.ApprovalsSettingsDocument,
    "\n  mutation SaveApprovalChain($kind: String!, $enabled: Boolean!, $steps: JSON!) {\n    saveApprovalChain(kind: $kind, enabled: $enabled, steps: $steps) { chain { kind } errors { field message } }\n  }\n": types.SaveApprovalChainDocument,
    "\n  query AttendanceSetup {\n    attendanceSettings { enabled graceMinutes requireLocation overtimeAfterMinutes overtimeMultiplier payOvertime deductAbsence timesheetsEnabled }\n    shifts { id name start end breakMinutes weekdays isDefault isActive people }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }\n  }\n": types.AttendanceSetupDocument,
    "\n  mutation SaveAttendanceSettings($input: AttendanceSettingsInput!) { saveAttendanceSettings(input: $input) { enabled } }\n": types.SaveAttendanceSettingsDocument,
    "\n  mutation SaveShift($input: ShiftInput!) { saveShift(input: $input) { shift { id } errors { field message } } }\n": types.SaveShiftDocument,
    "\n  mutation AssignShift($shift: ID!, $ids: [ID!]!, $start: Date!) { assignShift(shiftId: $shift, employeeIds: $ids, startDate: $start) }\n": types.AssignShiftDocument,
    "\n  query AuditLog($search: String, $action: String, $from: String, $to: String, $offset: Int!) {\n    auditLog(search: $search, action: $action, dateFrom: $from, dateTo: $to, offset: $offset, limit: 50) {\n      hasMore\n      entries { id at actor action objectType objectId summary changes ipAddress }\n    }\n  }\n": types.AuditLogDocument,
    "\n  query BenefitPlansSetup {\n    benefitPlans(includeInactive: true) {\n      id name kind provider description employeeRate employerRate basis statutory isActive enrolledCount\n    }\n  }\n": types.BenefitPlansSetupDocument,
    "\n  mutation SaveBenefitPlan($input: SaveBenefitPlanInput!) {\n    saveBenefitPlan(input: $input) { plan { id } errors { field message } }\n  }\n": types.SaveBenefitPlanDocument,
    "\n  query TaskTemplates {\n    taskTemplates { id kind title description category assignee dueOffset isActive appliesTo }\n    departments { id name isActive }\n    locations { id name isActive }\n  }\n": types.TaskTemplatesDocument,
    "\n  mutation SaveTaskTemplate($input: SaveTaskTemplateInput!) {\n    saveTaskTemplate(input: $input) { template { id } errors { field message } }\n  }\n": types.SaveTaskTemplateDocument,
    "\n  query CompanySettings {\n    companySettings {\n      name country currency timezone primaryColor logoUrl requireAdminMfa sessionTimeoutMinutes ipAllowlist yourIp\n      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads payrollEnabled\n    }\n  }\n": types.CompanySettingsDocument,
    "\n  mutation UpdateCompanySettings($input: CompanySettingsInput!) {\n    updateCompanySettings(input: $input) { settings { name } errors { field message } }\n  }\n": types.UpdateCompanySettingsDocument,
    "\n  mutation RemoveCompanyLogo { removeCompanyLogo }\n": types.RemoveCompanyLogoDocument,
    "\n  query DirectorySettingsAdmin {\n    directorySettings { directory orgChart roles fields }\n    directoryFieldChoices { key label }\n    roles { code name }\n  }\n": types.DirectorySettingsAdminDocument,
    "\n  mutation SaveDirectorySettings($settings: JSON!) {\n    saveDirectorySettings(settings: $settings) { directory }\n  }\n": types.SaveDirectorySettingsDocument,
    "\n  query ExpenseSetup {\n    expenseSettings { enabled managerApproval financeApproval receiptOver maxAgeDays payVia }\n    expenseCategories(includeInactive: true) { id name description accountCode limitPerItem limitPerMonth receiptRequired mileageRate isActive used }\n  }\n": types.ExpenseSetupDocument,
    "\n  mutation SaveExpenseSettings($input: ExpenseSettingsInput!) { saveExpenseSettings(input: $input) { enabled } }\n": types.SaveExpenseSettingsDocument,
    "\n  mutation SaveExpenseCategory($input: ExpenseCategoryInput!) { saveExpenseCategory(input: $input) { category { id } errors { field message } } }\n": types.SaveExpenseCategoryDocument,
    "\n  query CustomFieldsAdmin {\n    customFields(includeInactive: true) { id name key fieldType choices helpText hrOnly position isActive }\n  }\n": types.CustomFieldsAdminDocument,
    "\n  mutation SaveCustomField($input: SaveCustomFieldInput!) {\n    saveCustomField(input: $input) { field { id } errors { field message } }\n  }\n": types.SaveCustomFieldDocument,
    "\n  query Organization {\n    legalEntities { id name registrationNumber country currency isActive }\n    locations { id name address city country timezone latitude longitude radiusM isActive legalEntity { id name } }\n    departments { id name code isActive legalEntity { id name } parent { id name } head { id fullName } }\n    jobTitles { id name description isActive }\n    grades { id name rank isActive payMin payMid payMax }\n    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }\n    aiWriting\n  }\n": types.OrganizationDocument,
    "\n  mutation DraftJobDescription($title: String!, $notes: String!) { draftJobDescription(title: $title, notes: $notes) }\n": types.DraftJobDescriptionDocument,
    "\n  mutation SaveLegalEntity($input: SaveLegalEntityInput!) {\n    saveLegalEntity(input: $input) { legalEntity { id } errors { field message } }\n  }\n": types.SaveLegalEntityDocument,
    "\n  mutation SaveLocation($input: SaveLocationInput!) {\n    saveLocation(input: $input) { location { id } errors { field message } }\n  }\n": types.SaveLocationDocument,
    "\n  mutation SaveDepartment($input: SaveDepartmentInput!) {\n    saveDepartment(input: $input) { department { id } errors { field message } }\n  }\n": types.SaveDepartmentDocument,
    "\n  mutation SaveJobTitle($input: SaveJobTitleInput!) {\n    saveJobTitle(input: $input) { jobTitle { id } errors { field message } }\n  }\n": types.SaveJobTitleDocument,
    "\n  mutation SaveGrade($input: SaveGradeInput!) {\n    saveGrade(input: $input) { grade { id } errors { field message } }\n  }\n": types.SaveGradeDocument,
    "\n  query PayrollSettings {\n    payGroups { id name legalEntityId legalEntity country currency frequency payDay anchorDate isActive memberCount supported }\n    payComponents { id code name kind role percentOfGross taxable pensionable isActive }\n    rulePacks { id country effectiveFrom name data source }\n    legalEntities { id name country isActive }\n  }\n": types.PayrollSettingsDocument,
    "\n  mutation SavePayGroup($input: PayGroupInput!) { savePayGroup(input: $input) { group { id } errors { field message } } }\n": types.SavePayGroupDocument,
    "\n  mutation SavePayComponent($input: PayComponentInput!) { savePayComponent(input: $input) { component { id } errors { field message } } }\n": types.SavePayComponentDocument,
    "query ReviewTemplates { reviewTemplates { id name questions scale isActive cycles } }": types.ReviewTemplatesDocument,
    "\n  mutation SaveReviewTemplate($input: ReviewTemplateInput!) { saveReviewTemplate(input: $input) { template { id } errors { field message } } }\n": types.SaveReviewTemplateDocument,
    "mutation DeleteReviewTemplate($id: ID!) { deleteReviewTemplate(id: $id) }": types.DeleteReviewTemplateDocument,
    "\n  query LeaveSetup($year: Int!) {\n    leaveTypes(includeInactive: true) { id name code color isPaid tracksBalance paidOutOnExit allowHalfDays approvalLevels isActive }\n    leavePolicies {\n      id name daysPerYear accrual proRata startsOn carryOverMax carryOverExpiryMonths employmentType isActive\n      leaveType { id name color }\n      legalEntity { id name }\n      location { id name }\n      grade { id name }\n      tenureRules { years extraDays }\n    }\n    publicHolidays(year: $year) { id name date location { id name } }\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    grades { id name isActive }\n  }\n": types.LeaveSetupDocument,
    "\n  mutation SaveLeaveType($input: SaveLeaveTypeInput!) {\n    saveLeaveType(input: $input) { leaveType { id } errors { field message } }\n  }\n": types.SaveLeaveTypeDocument,
    "\n  mutation SaveLeavePolicy($input: SaveLeavePolicyInput!) {\n    saveLeavePolicy(input: $input) { policy { id } errors { field message } }\n  }\n": types.SaveLeavePolicyDocument,
    "\n  mutation SavePublicHoliday($input: SavePublicHolidayInput!) {\n    savePublicHoliday(input: $input) { holiday { id } errors { field message } }\n  }\n": types.SavePublicHolidayDocument,
    "\n  mutation DeletePublicHoliday($id: ID!) {\n    deletePublicHoliday(id: $id)\n  }\n": types.DeletePublicHolidayDocument,
    "\n  query TrainingAdmin {\n    trainingCourses(includeInactive: true) { id name description category required frequencyMonths dueDays appliesTo isActive }\n    departments { id name isActive }\n    locations { id name isActive }\n  }\n": types.TrainingAdminDocument,
    "\n  mutation SaveTrainingCourse($input: TrainingCourseInput!) {\n    saveTrainingCourse(input: $input) { course { id } errors { field message } }\n  }\n": types.SaveTrainingCourseDocument,
    "mutation DeleteTrainingCourse($id: ID!) { deleteTrainingCourse(id: $id) }": types.DeleteTrainingCourseDocument,
    "\n  query UsersAdmin {\n    members {\n      id email firstName lastName fullName isActive invitePending lastLogin\n      roles { code name scope }\n      employee { id name }\n      legalEntities { id name }\n      locations { id name }\n      departments { id name }\n    }\n    roles { id code name scope permissions }\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    departments { id name isActive }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE, CANDIDATE] }) { nodes { id fullName } }\n  }\n": types.UsersAdminDocument,
    "\n  mutation InviteMember($input: InviteMemberInput!) {\n    inviteMember(input: $input) { member { id } errors { field message } }\n  }\n": types.InviteMemberDocument,
    "\n  mutation UpdateMember($input: UpdateMemberInput!) {\n    updateMember(input: $input) { member { id } errors { field message } }\n  }\n": types.UpdateMemberDocument,
    "\n  mutation CorrectInvite($input: CorrectInviteInput!) {\n    correctInvite(input: $input) { member { id } errors { field message } }\n  }\n": types.CorrectInviteDocument,
    "\n  mutation CancelInvite($id: ID!) {\n    cancelInvite(id: $id) { errors { field message } }\n  }\n": types.CancelInviteDocument,
    "\n  mutation ResendInvite($id: ID!) {\n    resendInvite(id: $id)\n  }\n": types.ResendInviteDocument,
    "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n": types.RequestPasswordResetDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      mfaRequired\n      me { permissions }\n      errors { field message }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation VerifyMfa($code: String!) {\n    verifyMfa(code: $code) {\n      me { permissions }\n      errors { field message }\n    }\n  }\n": types.VerifyMfaDocument,
    "\n  query PasswordLink($uid: String!, $token: String!) {\n    passwordLink(uid: $uid, token: $token)\n  }\n": types.PasswordLinkDocument,
    "\n  mutation SetPassword($input: SetPasswordInput!) {\n    setPassword(input: $input) { ok errors { field message } }\n  }\n": types.SetPasswordDocument,
    "\n  mutation RedeemWelcome($token: String!) {\n    redeemWelcome(token: $token) { me { mfaSetupRequired } errors { message } }\n  }\n": types.RedeemWelcomeDocument,
    "\n  query SlugCheck($slug: String!) {\n    slugCheck(slug: $slug)\n  }\n": types.SlugCheckDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) { url codeSentTo errors { field message } }\n  }\n": types.SignUpDocument,
    "\n  query SignupEmailCheck($email: String!) {\n    signupEmailCheck(email: $email) { problem freeWebmail }\n  }\n": types.SignupEmailCheckDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  query WaitingApprovals {\n    leaveApprovals { id }\n    pendingChanges { id canDecide }\n  }\n": types.WaitingApprovalsDocument,
    "\n  mutation StopViewAs { stopViewAs { permissions } }\n": types.StopViewAsDocument,
    "\n  query GlobalSearch($q: String!) {\n    search(q: $q) { kind title subtitle href photoUrl }\n  }\n": types.GlobalSearchDocument,
    "\n  query NotificationList($first: Int!, $after: String) {\n    unreadNotificationCount\n    notifications(first: $first, after: $after) {\n      nodes { id kind title body link read createdAt }\n      pageInfo { hasNextPage endCursor }\n    }\n  }\n": types.NotificationListDocument,
    "\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n": types.UnreadNotificationCountDocument,
    "\n  mutation MarkNotificationsRead($ids: [ID!]) {\n    markNotificationsRead(ids: $ids)\n  }\n": types.MarkNotificationsReadDocument,
    "query PushPublicKey { pushPublicKey }": types.PushPublicKeyDocument,
    "\n  mutation SavePushSubscription($endpoint: String!, $p256dh: String!, $auth: String!, $userAgent: String!) {\n    savePushSubscription(endpoint: $endpoint, p256dh: $p256dh, auth: $auth, userAgent: $userAgent)\n  }\n": types.SavePushSubscriptionDocument,
    "mutation RemovePushSubscription($endpoint: String!) { removePushSubscription(endpoint: $endpoint) }": types.RemovePushSubscriptionDocument,
    "\n  query PendingPayJobChanges {\n    pendingChanges { id kind kindName employeeId employeeName summary status step stepCount requestedBy createdAt canDecide canCancel }\n  }\n": types.PendingPayJobChangesDocument,
    "\n  mutation DecidePendingChange($id: ID!, $approve: Boolean!, $note: String) {\n    decidePendingChange(id: $id, approve: $approve, note: $note) { change { id status } errors { message } }\n  }\n": types.DecidePendingChangeDocument,
    "\n  mutation CancelPendingChange($id: ID!) {\n    cancelPendingChange(id: $id) { change { id status } errors { message } }\n  }\n": types.CancelPendingChangeDocument,
    "\n  query MyClock {\n    myAttendance(days: 1) { enabled shift shiftStart shiftEnd geofenced clockedIn { id clockIn } }\n  }\n": types.MyClockDocument,
    "\n  mutation PillClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }\n": types.PillClockInDocument,
    "\n  mutation PillClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }\n": types.PillClockOutDocument,
    "\n  query Projects { projects { id name code client costCentre billable employeeIds isActive } }\n": types.ProjectsDocument,
    "\n  mutation SaveProject($input: ProjectInput!) { saveProject(input: $input) { project { id } errors { field message } } }\n": types.SaveProjectDocument,
    "\n  fragment TimesheetFields on Timesheet {\n    id employeeId employeeName weekStart status submittedAt decidedBy decidedAt note totalMinutes mine canApprove\n    entries { projectId projectName date minutes note }\n    clocked { date minutes }\n  }\n": types.TimesheetFieldsFragmentDoc,
    "\n  query MyTimesheet($week: Date!) { myTimesheet(weekStart: $week) { ...TimesheetFields } myProjects { id name code client } }\n": types.MyTimesheetDocument,
    "\n  mutation SaveTimesheet($week: Date!, $entries: [TimesheetCellInput!]!) {\n    saveTimesheet(weekStart: $week, entries: $entries) { timesheet { ...TimesheetFields } errors { field message } }\n  }\n": types.SaveTimesheetDocument,
    "\n  mutation SubmitTimesheet($week: Date!) { submitTimesheet(weekStart: $week) { timesheet { ...TimesheetFields } errors { message } } }\n": types.SubmitTimesheetDocument,
    "query TimesheetsToApprove { timesheetsToApprove { ...TimesheetFields } }": types.TimesheetsToApproveDocument,
    "query TeamTimesheets($week: Date!) { teamTimesheets(weekStart: $week) { ...TimesheetFields } }": types.TeamTimesheetsDocument,
    "\n  mutation DecideTimesheet($id: ID!, $approve: Boolean!, $note: String!) {\n    decideTimesheet(id: $id, approve: $approve, note: $note) { timesheet { id status } errors { field message } }\n  }\n": types.DecideTimesheetDocument,
    "\n  mutation ReopenTimesheet($id: ID!, $note: String!) { reopenTimesheet(id: $id, note: $note) { timesheet { id status } errors { message } } }\n": types.ReopenTimesheetDocument,
    "\n  mutation EmailMyCompanies($email: String!) {\n    emailMyCompanies(email: $email)\n  }\n": types.EmailMyCompaniesDocument,
    "\n  query EmployeeDocuments($employeeId: ID!) {\n    employeeDocuments(employeeId: $employeeId) {\n      id title originalName contentType size expiresOn notes uploadedBy createdAt\n      category { id name requiresExpiry employeeCanView managerCanView }\n    }\n  }\n": types.EmployeeDocumentsDocument,
    "\n  query DocumentCategoryOptions {\n    documentCategories { id name requiresExpiry employeeCanView managerCanView isActive }\n  }\n": types.DocumentCategoryOptionsDocument,
    "\n  mutation DocumentDownloadUrl($id: ID!) {\n    documentDownloadUrl(id: $id)\n  }\n": types.DocumentDownloadUrlDocument,
    "\n  mutation UpdateDocument($input: UpdateDocumentInput!) {\n    updateDocument(input: $input) { document { id } errors { field message } }\n  }\n": types.UpdateDocumentDocument,
    "\n  mutation RemoveDocument($id: ID!) {\n    removeDocument(id: $id)\n  }\n": types.RemoveDocumentDocument,
    "\n  query DocumentsAdmin($within: Int!) {\n    expiringDocuments(withinDays: $within) {\n      id title expiresOn\n      employee { id fullName }\n      category { id name }\n    }\n    documentCategories(includeInactive: true) { id name employeeCanView managerCanView requiresExpiry isActive }\n  }\n": types.DocumentsAdminDocument,
    "\n  mutation SaveDocumentCategory($input: SaveDocumentCategoryInput!) {\n    saveDocumentCategory(input: $input) { category { id } errors { field message } }\n  }\n": types.SaveDocumentCategoryDocument,
    "\n  mutation UpdateEmployee($input: UpdateEmployeeInput!) {\n    updateEmployee(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n": types.UpdateEmployeeDocument,
    "\n  query JobOptions {\n    legalEntities { id name isActive }\n    departments { id name isActive legalEntity { id } }\n    locations { id name isActive legalEntity { id } }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }\n  }\n": types.JobOptionsDocument,
    "\n  mutation RequestJobChange($input: ChangeJobInput!) {\n    requestJobChange(input: $input) { waitingForApproval errors { field message } }\n  }\n": types.RequestJobChangeDocument,
    "\n  mutation RequestPayChange($input: ChangeCompensationInput!) {\n    requestPayChange(input: $input) { waitingForApproval errors { field message } }\n  }\n": types.RequestPayChangeDocument,
    "\n  mutation ChangeEmployeeJob($input: ChangeJobInput!) {\n    changeEmployeeJob(input: $input) {\n      employee { id }\n      waitingForApproval\n      errors { field message }\n    }\n  }\n": types.ChangeEmployeeJobDocument,
    "\n  mutation ChangeEmployeeCompensation($input: ChangeCompensationInput!) {\n    changeEmployeeCompensation(input: $input) {\n      employee { id }\n      waitingForApproval\n      errors { field message }\n    }\n  }\n": types.ChangeEmployeeCompensationDocument,
    "\n  mutation ChangeEmployeeStatus($input: ChangeStatusInput!) {\n    changeEmployeeStatus(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n": types.ChangeEmployeeStatusDocument,
    "\n  mutation SaveEmergencyContact($input: EmergencyContactInput!) {\n    saveEmergencyContact(input: $input) { contact { id } errors { field message } }\n  }\n": types.SaveEmergencyContactDocument,
    "\n  mutation DeleteEmergencyContact($id: ID!) {\n    deleteEmergencyContact(id: $id)\n  }\n": types.DeleteEmergencyContactDocument,
    "\n  mutation RevealPrivateDetails($employeeId: ID!) {\n    revealPrivateDetails(employeeId: $employeeId) { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }\n  }\n": types.RevealPrivateDetailsDocument,
    "\n  mutation SavePrivateDetails($input: PrivateDetailsInput!) {\n    savePrivateDetails(input: $input) { details { masked } errors { field message } }\n  }\n": types.SavePrivateDetailsDocument,
    "\n  mutation SetEmployeeCustomValues($employeeId: ID!, $values: JSON!) {\n    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }\n  }\n": types.SetEmployeeCustomValuesDocument,
    "\n  query MyChangeRequests {\n    myChangeRequests { id status note createdAt decidedAt decidedBy lines { field label current requested } }\n  }\n": types.MyChangeRequestsDocument,
    "\n  mutation UpdateMyDetails($input: MyDetailsInput!) {\n    updateMyDetails(input: $input) { applied request { id } errors { field message } }\n  }\n": types.UpdateMyDetailsDocument,
    "\n  mutation CancelChangeRequest($id: ID!) {\n    cancelChangeRequest(id: $id) { request { id status } errors { field message } }\n  }\n": types.CancelChangeRequestDocument,
    "\n  fragment ClaimRowFields on ExpenseClaim {\n    id title employeeId employeeName department currency total status stage approverName submittedAt approvedAt paidAt payVia\n    paymentReference payrollPeriod linesCount flags mine canDecide canPay createdAt\n  }\n": types.ClaimRowFieldsFragmentDoc,
    "\n  query WidgetFilters {\n    widgetFilters { key label options { value label } }\n  }\n": types.WidgetFiltersDocument,
    "\n  query PendingTimeOff($filter: WidgetFilter) {\n    pendingTimeOff(filter: $filter) {\n      id approverName startDate endDate days leaveType submittedAt urgent\n      person { id fullName photoUrl }\n    }\n  }\n": types.PendingTimeOffDocument,
    "\n  query TimeOffUsedWidget($leaveTypeId: ID!, $filter: WidgetFilter) {\n    timeOffUsed(leaveTypeId: $leaveTypeId, filter: $filter) {\n      total people\n      months { month value }\n      previousYear { month value }\n    }\n  }\n": types.TimeOffUsedWidgetDocument,
    "\n  query TimeOffUsedTypes {\n    leaveTypes { id name }\n  }\n": types.TimeOffUsedTypesDocument,
    "\n  query LocationWidget($filter: WidgetFilter) {\n    locationBreakdown(filter: $filter) {\n      total\n      current { label value }\n      history { month values { label value } }\n    }\n  }\n": types.LocationWidgetDocument,
    "\n  query PayRaiseWidget($filter: WidgetFilter) {\n    withoutPayRaise(filter: $filter) {\n      count\n      people { hireDate lastRaise amount currency person { id fullName jobTitle } }\n    }\n  }\n": types.PayRaiseWidgetDocument,
    "\n  query MyReminders($employeeId: ID) {\n    myReminders(employeeId: $employeeId) { id text dueOn doneAt employee { id fullName } }\n  }\n": types.MyRemindersDocument,
    "\n  mutation CreateReminder($input: ReminderInput!) { createReminder(input: $input) { reminder { id } errors { field message } } }\n": types.CreateReminderDocument,
    "\n  mutation SnoozeReminder($id: ID!, $dueOn: Date) { updateReminder(id: $id, dueOn: $dueOn) { reminder { id dueOn } errors { message } } }\n": types.SnoozeReminderDocument,
    "\n  mutation CompleteReminder($id: ID!, $done: Boolean!) { completeReminder(id: $id, done: $done) { reminder { id doneAt } errors { message } } }\n": types.CompleteReminderDocument,
    "\n  mutation DeleteReminder($id: ID!) { deleteReminder(id: $id) }\n": types.DeleteReminderDocument,
    "\n  query HomeData {\n    home {\n      setup { percent steps { key label why href done group } }\n      myProfile { percent missing { key label tab critical why } }\n      dataGaps { key label why count people { id fullName jobTitle photoUrl } }\n      celebrations { kind date years person { id fullName jobTitle photoUrl } }\n      newHires { hireDate person { id fullName jobTitle photoUrl } }\n      myStuff { trainings certifications certificationsExpiring benefits openTasks }\n      directReports {\n        notes outToday department location timezone workEmail workPhone workPhoneExt\n        events { kind label date }\n        person { id fullName jobTitle photoUrl }\n      }\n      insights {\n        months { month headcount additions terminations voluntary involuntary other turnoverRate }\n        headcount change changePercent additions terminations turnoverRate\n        byLocation { label value } byDepartment { label value } byEmploymentType { label value }\n        byGender { label value } byAge { label value } benefitEnrollments { label value }\n        expiringCertifications { name people soonest }\n        pendingUrgent pendingOther withoutPayRaise\n        onboarding { inProgress withOverdue starting { date people { id fullName jobTitle photoUrl } } }\n      }\n    }\n    announcements(limit: 20) { id title body authorName publishedAt pinned }\n    companyLinks { id group label url }\n    homeLayout { key hidden }\n    dismissedFeed\n  }\n": types.HomeDataDocument,
    "\n  query ProjectedLeave($leaveTypeId: ID!, $on: Date!) {\n    projectedLeaveBalance(leaveTypeId: $leaveTypeId, on: $on) { balance pending available }\n  }\n": types.ProjectedLeaveDocument,
    "\n  query HomeApprovals {\n    leaveApprovals { id startDate endDate days createdAt canDecide employee { id fullName photoUrl } leaveType { name color } }\n  }\n": types.HomeApprovalsDocument,
    "\n  query HomeChanges {\n    pendingChangeRequests { id employeeId employeeName createdAt canDecide }\n  }\n": types.HomeChangesDocument,
    "\n  mutation HomeDecideLeave($input: DecideLeaveInput!) {\n    decideLeave(input: $input) { request { id status } errors { field message } }\n  }\n": types.HomeDecideLeaveDocument,
    "\n  mutation DismissFeedItem($key: String!) {\n    dismissFeedItem(key: $key)\n  }\n": types.DismissFeedItemDocument,
    "\n  mutation SaveAnnouncement($input: AnnouncementInput!) {\n    saveAnnouncement(input: $input) { announcement { id } errors { field message } }\n  }\n": types.SaveAnnouncementDocument,
    "\n  mutation DeleteAnnouncement($id: ID!) {\n    deleteAnnouncement(id: $id)\n  }\n": types.DeleteAnnouncementDocument,
    "\n  query HomeWhosOut($day: Date!) {\n    leaveCalendar(start: $day, end: $day) { absences { requestId status employee { id fullName photoUrl } leaveType { name } } }\n  }\n": types.HomeWhosOutDocument,
    "\n  mutation SaveCompanyLinks($links: [CompanyLinkInput!]!) {\n    saveCompanyLinks(links: $links) { links { id } errors { field message } }\n  }\n": types.SaveCompanyLinksDocument,
    "\n  query HomeHolidays($year: Int!, $next: Int!) {\n    thisYear: publicHolidays(year: $year) { id name date location { name } }\n    nextYear: publicHolidays(year: $next) { id name date location { name } }\n  }\n": types.HomeHolidaysDocument,
    "\n  query EmployeeLeave($employeeId: ID) {\n    employeeLeave(employeeId: $employeeId) {\n      employee { id fullName }\n      balances {\n        leaveType { id name color tracksBalance allowHalfDays isPaid }\n        policyName entitlement balance pending available takenThisYear\n      }\n      requests {\n        id startDate endDate halfDay days reason status createdAt canCancel canDecide\n        leaveType { id name color }\n        approvals { level status note overridden actedBy actedAt approver { id fullName } }\n      }\n      ledger { id date kind amount reason leaveType { name } }\n    }\n  }\n": types.EmployeeLeaveDocument,
    "\n  mutation CancelLeave($id: ID!) {\n    cancelLeave(id: $id) {\n      request { id status }\n      errors { field message }\n    }\n  }\n": types.CancelLeaveDocument,
    "\n  query LeaveQuote($leaveTypeId: ID!, $startDate: Date!, $endDate: Date!, $halfDay: Boolean!, $employeeId: ID) {\n    leaveQuote(leaveTypeId: $leaveTypeId, startDate: $startDate, endDate: $endDate, halfDay: $halfDay, employeeId: $employeeId) {\n      days available availableAfter\n      errors { field message }\n    }\n  }\n": types.LeaveQuoteDocument,
    "\n  mutation RequestLeave($input: RequestLeaveInput!) {\n    requestLeave(input: $input) {\n      request { id status }\n      errors { field message }\n    }\n  }\n": types.RequestLeaveDocument,
    "\n  mutation AdjustLeaveBalance($input: AdjustLeaveInput!) {\n    adjustLeaveBalance(input: $input) {\n      balance { balance }\n      errors { field message }\n    }\n  }\n": types.AdjustLeaveBalanceDocument,
    "\n  query PayrollLoans {\n    loans { id employeeId employeeName kind amount instalment firstDeduction reason status outstanding repaid }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }\n  }\n": types.PayrollLoansDocument,
    "\n  mutation SaveLoan($input: LoanInput!) { saveLoan(input: $input) { loan { id } errors { field message } } }\n": types.SaveLoanDocument,
    "\n  mutation CloseLoan($id: ID!, $repaid: Boolean!) { closeLoan(id: $id, repaid: $repaid) { id status } }\n": types.CloseLoanDocument,
    "\n  query MyLoans { myLoans { id kind amount outstanding status } }\n": types.MyLoansDocument,
    "\n  query PeopleList($filter: EmployeeFilter, $first: Int, $after: String, $sort: String, $descending: Boolean!) {\n    employees(filter: $filter, first: $first, after: $after, sort: $sort, descending: $descending) {\n      totalCount\n      pageInfo { hasNextPage endCursor }\n      nodes {\n        id employeeNumber firstName lastName preferredName fullName photoUrl status employmentType hireDate\n        workEmail workPhone workPhoneExt phone gender dateOfBirth\n        jobTitle { name } department { name } location { name } legalEntity { name } grade { name } manager { fullName }\n      }\n    }\n  }\n": types.PeopleListDocument,
    "\n  query PeopleFilterOptions {\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    teams { id name isActive }\n    employeeViews { id name filter columns }\n  }\n": types.PeopleFilterOptionsDocument,
    "\n  mutation SavePeopleView($input: EmployeeViewInput!) {\n    saveEmployeeView(input: $input) { view { id name } errors { field message } }\n  }\n": types.SavePeopleViewDocument,
    "\n  mutation DeletePeopleView($id: ID!) {\n    deleteEmployeeView(id: $id)\n  }\n": types.DeletePeopleViewDocument,
    "\n  query PowerEditPeople($filter: EmployeeFilter, $first: Int, $after: String) {\n    employees(filter: $filter, first: $first, after: $after, sort: \"name\") {\n      totalCount\n      pageInfo { hasNextPage endCursor }\n      nodes {\n        id employeeNumber firstName middleName lastName preferredName fullName photoUrl status employmentType\n        workEmail personalEmail phone workPhone workPhoneExt dateOfBirth gender maritalStatus\n        jobTitle { id name } department { id name } location { id name } legalEntity { id name } grade { id name } manager { id fullName }\n        personal { nationality linkedinUrl homePhone addressLine1 addressLine2 city state postalCode country }\n        customValues { field { key } value }\n      }\n    }\n  }\n": types.PowerEditPeopleDocument,
    "\n  query PowerEditLookups {\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    customFields { key name fieldType choices }\n    orgChart { id fullName }\n  }\n": types.PowerEditLookupsDocument,
    "\n  mutation PowerEdit($input: PowerEditInput!) {\n    powerEdit(input: $input) { employeeId fullName ok errors { field message } }\n  }\n": types.PowerEditDocument,
    "\n  query PeopleOrg {\n    orgChart {\n      id fullName jobTitle departmentId department locationId location legalEntityId legalEntity place timezone\n      workEmail workPhone workPhoneExt photoUrl managerId managerName directReportCount outUntil employeeNumber hireDate mobile linkedinUrl twitter facebook\n    }\n  }\n": types.PeopleOrgDocument,
    "\n  mutation SaveReviewCycle($input: ReviewCycleInput!) { saveReviewCycle(input: $input) { cycle { id } errors { field message } } }\n": types.SaveReviewCycleDocument,
    "\n  query PerformancePeopleSearch($search: String) { directory(search: $search, first: 8) { nodes { id fullName jobTitle } } }\n": types.PerformancePeopleSearchDocument,
    "\n  fragment GoalFields on Goal {\n    id title description employeeId employeeName parentId parentTitle startDate dueDate progress status supporting canEdit updatedAt\n    keyResults { id title startValue targetValue currentValue unit progress }\n  }\n": types.GoalFieldsFragmentDoc,
    "\n  fragment ReviewRowFields on ReviewSummary {\n    id cycleName cycleStatus employeeName department managerName status overallRating calibratedRating scale myRole myResponseId myResponseDone due\n    selfDone managerDone\n  }\n": types.ReviewRowFieldsFragmentDoc,
    "\n  query EmployeeBenefits($employeeId: ID!) {\n    employeeBenefits(employeeId: $employeeId) {\n      id status startDate endDate memberNumber coverage dependants note\n      plan { id name kind provider employeeRate employerRate basis statutory }\n    }\n    benefitPlans { id name kind provider employeeRate employerRate basis statutory isActive }\n  }\n": types.EmployeeBenefitsDocument,
    "\n  mutation SaveBenefitEnrollment($input: SaveEnrollmentInput!) {\n    saveBenefitEnrollment(input: $input) { enrollment { id } errors { field message } }\n  }\n": types.SaveBenefitEnrollmentDocument,
    "\n  mutation DeleteBenefitEnrollment($id: ID!) {\n    deleteBenefitEnrollment(id: $id)\n  }\n": types.DeleteBenefitEnrollmentDocument,
    "\n  mutation SetBonusTarget($input: BonusTargetInput!) {\n    setBonusTarget(input: $input) { employee { id } errors { field message } }\n  }\n": types.SetBonusTargetDocument,
    "\n  mutation AddEmployeeNote($employeeId: ID!, $body: String!, $remindOn: Date) {\n    addEmployeeNote(employeeId: $employeeId, body: $body, remindOn: $remindOn) { note { id } errors { field message } }\n  }\n": types.AddEmployeeNoteDocument,
    "\n  mutation DeleteEmployeeNote($id: ID!) {\n    deleteEmployeeNote(id: $id)\n  }\n": types.DeleteEmployeeNoteDocument,
    "\n  query EmployeeChecklist($employeeId: ID!, $kind: ChecklistKind!) {\n    checklist(employeeId: $employeeId, kind: $kind) {\n      startDate\n      tasks { id title description category assignee dueDate completedAt completedByName canComplete }\n    }\n  }\n": types.EmployeeChecklistDocument,
    "\n  mutation StartChecklist($employeeId: ID!, $kind: ChecklistKind!, $startDate: Date) {\n    startChecklist(employeeId: $employeeId, kind: $kind, startDate: $startDate) { tasks { id } errors { field message } }\n  }\n": types.StartChecklistDocument,
    "\n  mutation SetTaskDone($id: ID!, $done: Boolean!) {\n    setTaskDone(id: $id, done: $done) { task { id completedAt } errors { field message } }\n  }\n": types.SetTaskDoneDocument,
    "\n  mutation AddEmployeeTask($input: AddTaskInput!) {\n    addEmployeeTask(input: $input) { task { id } errors { field message } }\n  }\n": types.AddEmployeeTaskDocument,
    "\n  mutation DeleteEmployeeTask($id: ID!) {\n    deleteEmployeeTask(id: $id)\n  }\n": types.DeleteEmployeeTaskDocument,
    "\n  mutation SaveLayoutCustomField($input: SaveCustomFieldInput!) {\n    saveCustomField(input: $input) { field { id key name } errors { field message } }\n  }\n": types.SaveLayoutCustomFieldDocument,
    "\n  mutation SaveLayoutCustomTable($input: SaveCustomTableInput!) {\n    saveCustomTable(input: $input) { table { id key name } errors { field message } }\n  }\n": types.SaveLayoutCustomTableDocument,
    "\n  mutation UpdateEmployeeFields($input: UpdateEmployeeInput!) {\n    updateEmployee(input: $input) { employee { id } errors { field message } }\n  }\n": types.UpdateEmployeeFieldsDocument,
    "\n  mutation UpdateMyFields($input: MyDetailsInput!) {\n    updateMyDetails(input: $input) { applied request { id } errors { field message } }\n  }\n": types.UpdateMyFieldsDocument,
    "\n  mutation SetCustomFields($employeeId: ID!, $values: JSON!) {\n    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }\n  }\n": types.SetCustomFieldsDocument,
    "\n  query LeaveHistory($employeeId: ID, $leaveTypeId: ID!, $year: Int) {\n    leaveHistory(employeeId: $employeeId, leaveTypeId: $leaveTypeId, year: $year) {\n      years\n      rows { id date kind description detail used earned balance }\n    }\n  }\n": types.LeaveHistoryDocument,
    "\n  mutation SaveTableRow($input: TableRowInput!) {\n    saveTableRow(input: $input) { row { id } errors { field message } }\n  }\n": types.SaveTableRowDocument,
    "\n  mutation DeleteTableRow($id: ID!) {\n    deleteTableRow(id: $id)\n  }\n": types.DeleteTableRowDocument,
    "\n  query TrainingStatus($id: ID!) {\n    trainingStatus(employeeId: $id) { courseId course lastCompleted dueOn state }\n  }\n": types.TrainingStatusDocument,
    "\n  query EmployeeProfile($id: ID!) {\n    employee(id: $id) {\n      id\n      completeness { percent missing { key label tab critical why } }\n      employeeNumber\n      fieldAccess\n      fullName\n      firstName\n      middleName\n      lastName\n      preferredName\n      workEmail\n      personalEmail\n      phone\n      workPhone\n      workPhoneExt\n      dateOfBirth\n      gender\n      maritalStatus\n      personal { nationality pronouns linkedinUrl twitter facebook homePhone addressLine1 addressLine2 city state postalCode country }\n      photoUrl\n      status\n      hireDate\n      probationEndDate\n      terminationDate\n      terminationReason\n      employmentType\n      archivedAt\n      legalEntity { id name }\n      department { id name }\n      location { id name city country timezone }\n      jobTitle { id name description }\n      grade { id name }\n      manager { id fullName jobTitle { name } photoUrl }\n      directReports { id fullName jobTitle { name } }\n      emergencyContacts {\n        id name relationship phone workPhone workPhoneExt homePhone email isPrimary\n        addressLine1 addressLine2 city state postalCode country\n      }\n      privateDetails { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }\n      customValues { value field { id key name fieldType choices helpText hrOnly } }\n      tableRows { id tableKey values createdAt }\n      compensation { amount currency frequency effectiveDate payType paySchedule overtime }\n      compensationHistory { id amount currency frequency effectiveDate reason payType paySchedule overtime comment }\n      bonusTarget { percent amount }\n      statusHistory { id effectiveDate status comment }\n      notes { id body authorName createdAt }\n      employmentHistory {\n        id effectiveDate changeType reason\n        jobTitle { name }\n        department { name }\n        location { name }\n        grade { name }\n        manager { fullName }\n        employmentType\n      }\n    }\n  }\n": types.EmployeeProfileDocument,
    "\n  query ProfileLayout {\n    profileLayout {\n      tabs {\n        key name builtin\n        sections { key title icon items { id kind key label fields } }\n      }\n      library { id kind key label fields }\n    }\n    customTables(includeInactive: true) { id key name hrOnly pay standard isActive columns { key name type choices } }\n    customFields(includeInactive: true) { id key }\n  }\n": types.ProfileLayoutDocument,
    "\n  mutation SaveProfileLayout($config: JSON!) {\n    saveProfileLayout(config: $config) { layout { tabs { key } } errors { field message } }\n  }\n": types.SaveProfileLayoutDocument,
    "\n  query CustomReportOptions {\n    customReportFields { key label category }\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n  }\n": types.CustomReportOptionsDocument,
    "\n  query CustomReportPreview($fields: [String!], $filter: JSON, $showing: String!) {\n    runCustomReport(fields: $fields, filter: $filter, showing: $showing) { chart note rows columns { key label kind } summary { label value } }\n  }\n": types.CustomReportPreviewDocument,
    "\n  mutation SaveCustomReport($input: CustomReportInput!) {\n    saveCustomReport(input: $input) { report { id } errors { field message } }\n  }\n": types.SaveCustomReportDocument,
    "\n  query AccessLevels {\n    roles { id code name description permissions scope isSystem fieldAccess memberCount }\n    permissionCatalog { code description }\n    fieldGroups { key description }\n    members { id fullName email isActive invitePending lastLogin roles { code } }\n    me { user { email } }\n  }\n": types.AccessLevelsDocument,
    "\n  mutation SaveRole($input: SaveRoleInput!) {\n    saveRole(input: $input) { role { id } errors { field message } }\n  }\n": types.SaveRoleDocument,
    "\n  mutation DuplicateRole($id: ID!, $name: String!) {\n    duplicateRole(id: $id, name: $name) { role { id } errors { field message } }\n  }\n": types.DuplicateRoleDocument,
    "\n  mutation DeleteRole($id: ID!) {\n    deleteRole(id: $id)\n  }\n": types.DeleteRoleDocument,
    "\n  query AccountData {\n    dataExports { id status size summary error requestedBy createdAt finishedAt expiresAt }\n    accountClosure { status closesOn requestedAt requestedBy reason graceDays backupDays }\n  }\n": types.AccountDataDocument,
    "mutation RequestDataExport { requestDataExport { id status } }": types.RequestDataExportDocument,
    "mutation DataExportUrl($id: ID!) { dataExportUrl(id: $id) }": types.DataExportUrlDocument,
    "\n  mutation RequestAccountClosure($companyName: String!, $password: String!, $reason: String) {\n    requestAccountClosure(companyName: $companyName, password: $password, reason: $reason) { closure { status closesOn } errors { field message } }\n  }\n": types.RequestAccountClosureDocument,
    "mutation CancelAccountClosure { cancelAccountClosure { closure { status } errors { message } } }": types.CancelAccountClosureDocument,
    "\n  query MyCalendarFeeds { myCalendarFeeds { id kinds url lastUsedAt } }\n": types.MyCalendarFeedsDocument,
    "\n  mutation CreateCalendarFeed($kinds: [String!]!) { createCalendarFeed(kinds: $kinds) { id } }\n": types.CreateCalendarFeedDocument,
    "mutation DeleteCalendarFeed($id: ID!) { deleteCalendarFeed(id: $id) }": types.DeleteCalendarFeedDocument,
    "\n  query ApiKeys { apiKeys { id name prefix readOnly owner createdAt lastUsedAt } }\n": types.ApiKeysDocument,
    "\n  mutation CreateApiKey($name: String!, $readOnly: Boolean!) { createApiKey(name: $name, readOnly: $readOnly) { secret } }\n": types.CreateApiKeyDocument,
    "mutation RevokeApiKey($id: ID!) { revokeApiKey(id: $id) }": types.RevokeApiKeyDocument,
    "query MyEmailPreferences { myEmailPreferences { key label email } }": types.MyEmailPreferencesDocument,
    "\n  mutation SetEmailPreferences($off: [String!]!) { setEmailPreferences(emailOff: $off) { key email } }\n": types.SetEmailPreferencesDocument,
    "\n  query InviteCandidates { inviteCandidates { withoutEmail people { employeeId name email department } } }\n": types.InviteCandidatesDocument,
    "\n  mutation InviteEmployees($ids: [ID!]!) { inviteEmployees(employeeIds: $ids) { invited problems { name message } } }\n": types.InviteEmployeesDocument,
    "\n  query OptionListsAdmin {\n    optionLists { key name }\n    listOptions(includeInactive: true) { id listKey label position isActive }\n  }\n": types.OptionListsAdminDocument,
    "\n  mutation SaveListOption($input: ListOptionInput!) {\n    saveListOption(input: $input) { option { id } errors { field message } }\n  }\n": types.SaveListOptionDocument,
    "\n  mutation ReorderListOptions($ids: [ID!]!) { reorderListOptions(ids: $ids) }\n": types.ReorderListOptionsDocument,
    "\n  mutation DeleteListOption($id: ID!) { deleteListOption(id: $id) }\n": types.DeleteListOptionDocument,
    "\n  query ListChoices($key: ListKey!) {\n    listOptions(listKey: $key) { id label }\n  }\n": types.ListChoicesDocument,
    "\n  query SetupProgress { setupProgress { percent steps { key label why href done group } } }\n": types.SetupProgressDocument,
    "\n  query TeamsAdmin {\n    teams(includeInactive: true) { id name description isActive leadId leadName memberIds memberNames }\n    orgChart { id fullName jobTitle }\n  }\n": types.TeamsAdminDocument,
    "\n  mutation SaveTeam($input: TeamInput!) {\n    saveTeam(input: $input) { team { id } errors { field message } }\n  }\n": types.SaveTeamDocument,
    "\n  mutation DeleteTeam($id: ID!) { deleteTeam(id: $id) }\n": types.DeleteTeamDocument,
    "\n  mutation StartViewAs($id: ID!) {\n    startViewAs(memberId: $id) { permissions }\n  }\n": types.StartViewAsDocument,
    "\n  query EmployeeSnapshot($id: ID!) {\n    employee(id: $id) {\n      id fullName photoUrl employeeNumber workEmail phone workPhone workPhoneExt dateOfBirth\n      hireDate status employmentType\n      jobTitle { name } department { name } grade { name } legalEntity { name }\n      location { name city country }\n      manager { id fullName }\n      directReports { id }\n      employmentHistory { id effectiveDate changeType jobTitle { name } }\n      compensationHistory { id effectiveDate amount currency frequency }\n    }\n  }\n": types.EmployeeSnapshotDocument,
    "\n  query ReportCatalog {\n    reportCatalog { key title description usesRange groupings category favorite lastViewed }\n  }\n": types.ReportCatalogDocument,
    "\n  query CustomReports {\n    customReports { id name description fields filter showing shared ownerName mine favorite lastViewed }\n  }\n": types.CustomReportsDocument,
    "\n  mutation SetFavoriteReport($favorite: Boolean!, $key: String, $customId: ID) {\n    setFavoriteReport(favorite: $favorite, key: $key, customId: $customId)\n  }\n": types.SetFavoriteReportDocument,
    "\n  query Me {\n    me {\n      permissions\n      roles\n      user { id email fullName }\n      employee { id fullName jobTitle { name } }\n      hasPayslips\n      mfaEnabled mfaSetupRequired recoveryCodesLeft\n      viewingAs { name realName startedAt }\n    }\n    tenant {\n      name slug primaryColor country currency logoUrl\n      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads attendanceEnabled expensesEnabled timesheetsEnabled payrollEnabled status closesOn\n    }\n  }\n": types.MeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ChangePassword($current: String!, $new: String!) {\n    changePassword(current: $current, new: $new) { ok errors { field message } }\n  }\n"): (typeof documents)["\n  mutation ChangePassword($current: String!, $new: String!) {\n    changePassword(current: $current, new: $new) { ok errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartMfaSetup { startMfaSetup { secret uri qrSvg } }\n"): (typeof documents)["\n  mutation StartMfaSetup { startMfaSetup { secret uri qrSvg } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ConfirmMfaSetup($code: String!) {\n    confirmMfaSetup(code: $code) { codes errors { field message } }\n  }\n"): (typeof documents)["\n  mutation ConfirmMfaSetup($code: String!) {\n    confirmMfaSetup(code: $code) { codes errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DisableMfa($password: String!) {\n    disableMfa(password: $password) { ok errors { field message } }\n  }\n"): (typeof documents)["\n  mutation DisableMfa($password: String!) {\n    disableMfa(password: $password) { ok errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation NewRecoveryCodes($code: String!) {\n    newRecoveryCodes(code: $code) { codes errors { field message } }\n  }\n"): (typeof documents)["\n  mutation NewRecoveryCodes($code: String!) {\n    newRecoveryCodes(code: $code) { codes errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyAttendance {\n    myAttendance(days: 14) {\n      enabled shift shiftStart shiftEnd geofenced\n      clockedIn { id clockIn flags }\n      days { date shift scheduled worked late absent onLeave holiday\n        entries { id clockIn clockOut minutes flags note source }\n        overtime { id minutes status } }\n    }\n  }\n"): (typeof documents)["\n  query MyAttendance {\n    myAttendance(days: 14) {\n      enabled shift shiftStart shiftEnd geofenced\n      clockedIn { id clockIn flags }\n      days { date shift scheduled worked late absent onLeave holiday\n        entries { id clockIn clockOut minutes flags note source }\n        overtime { id minutes status } }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id flags } errors { message } } }\n"): (typeof documents)["\n  mutation ClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id flags } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id minutes } errors { message } } }\n"): (typeof documents)["\n  mutation ClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id minutes } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AttendanceBoard($date: Date) { attendanceBoard(date: $date) { employeeId employeeName department status clockIn clockOut worked flags } }\n"): (typeof documents)["\n  query AttendanceBoard($date: Date) { attendanceBoard(date: $date) { employeeId employeeName department status clockIn clockOut worked flags } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AttendanceDays($id: ID!, $start: Date!, $end: Date!) {\n    attendanceDays(employeeId: $id, start: $start, end: $end) { date shift scheduled worked late absent onLeave holiday\n      entries { id clockIn clockOut minutes flags note source } overtime { id minutes status } }\n  }\n"): (typeof documents)["\n  query AttendanceDays($id: ID!, $start: Date!, $end: Date!) {\n    attendanceDays(employeeId: $id, start: $start, end: $end) { date shift scheduled worked late absent onLeave holiday\n      entries { id clockIn clockOut minutes flags note source } overtime { id minutes status } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveTimeEntry($input: TimeEntryInput!) { saveTimeEntry(input: $input) { entry { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveTimeEntry($input: TimeEntryInput!) { saveTimeEntry(input: $input) { entry { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteTimeEntry($id: ID!) { deleteTimeEntry(id: $id) }"): (typeof documents)["mutation DeleteTimeEntry($id: ID!) { deleteTimeEntry(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OvertimeToDecide { overtimeToDecide { id employeeName date minutes } }\n"): (typeof documents)["\n  query OvertimeToDecide { overtimeToDecide { id employeeName date minutes } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DecideOvertime($id: ID!, $approve: Boolean!) { decideOvertime(id: $id, approve: $approve) { id status } }\n"): (typeof documents)["\n  mutation DecideOvertime($id: ID!, $approve: Boolean!) { decideOvertime(id: $id, approve: $approve) { id status } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ArchiveEmployee($id: ID!) {\n    archiveEmployee(id: $id) { employee { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation ArchiveEmployee($id: ID!) {\n    archiveEmployee(id: $id) { employee { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendEmployeePasswordReset($employeeId: ID!) {\n    sendEmployeePasswordReset(employeeId: $employeeId)\n  }\n"): (typeof documents)["\n  mutation SendEmployeePasswordReset($employeeId: ID!) {\n    sendEmployeePasswordReset(employeeId: $employeeId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeAccess($id: ID!) {\n    employee(id: $id) { id access { email roles isActive invitePending } }\n  }\n"): (typeof documents)["\n  query EmployeeAccess($id: ID!) {\n    employee(id: $id) { id access { email roles isActive invitePending } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveEmployeePhoto($employeeId: ID!) {\n    removeEmployeePhoto(employeeId: $employeeId)\n  }\n"): (typeof documents)["\n  mutation RemoveEmployeePhoto($employeeId: ID!) {\n    removeEmployeePhoto(employeeId: $employeeId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation HireEmployee($input: HireEmployeeInput!) {\n    hireEmployee(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation HireEmployee($input: HireEmployeeInput!) {\n    hireEmployee(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyDirectoryAccess { myDirectoryAccess { directory orgChart } }\n"): (typeof documents)["\n  query MyDirectoryAccess { myDirectoryAccess { directory orgChart } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PendingChanges {\n    pendingChangeRequests { id employeeId employeeName createdAt canDecide lines { field label current requested } }\n  }\n"): (typeof documents)["\n  query PendingChanges {\n    pendingChangeRequests { id employeeId employeeName createdAt canDecide lines { field label current requested } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DecideChangeRequest($id: ID!, $approve: Boolean!, $note: String) {\n    decideChangeRequest(id: $id, approve: $approve, note: $note) { request { id status } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation DecideChangeRequest($id: ID!, $approve: Boolean!, $note: String) {\n    decideChangeRequest(id: $id, approve: $approve, note: $note) { request { id status } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ExpenseClaim($id: ID!) {\n    expenseClaim(id: $id) {\n      ...ClaimRowFields\n      lines { id categoryId categoryName date description amount distanceKm receiptName receiptUrl flags }\n      actions { id actor action stage note createdAt }\n    }\n    expenseCategories { id name description limitPerItem limitPerMonth receiptRequired mileageRate }\n    expenseSettings { receiptOver maxAgeDays payVia }\n  }\n"): (typeof documents)["\n  query ExpenseClaim($id: ID!) {\n    expenseClaim(id: $id) {\n      ...ClaimRowFields\n      lines { id categoryId categoryName date description amount distanceKm receiptName receiptUrl flags }\n      actions { id actor action stage note createdAt }\n    }\n    expenseCategories { id name description limitPerItem limitPerMonth receiptRequired mileageRate }\n    expenseSettings { receiptOver maxAgeDays payVia }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RenameExpenseClaim($id: ID!, $title: String!) { renameExpenseClaim(id: $id, title: $title) { claim { id title } errors { message } } }"): (typeof documents)["mutation RenameExpenseClaim($id: ID!, $title: String!) { renameExpenseClaim(id: $id, title: $title) { claim { id title } errors { message } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteExpenseLine($id: ID!) { deleteExpenseLine(id: $id) { claim { id total } errors { message } } }"): (typeof documents)["mutation DeleteExpenseLine($id: ID!) { deleteExpenseLine(id: $id) { claim { id total } errors { message } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SubmitExpenseClaim($id: ID!) { submitExpenseClaim(id: $id) { claim { id status } errors { message } } }"): (typeof documents)["mutation SubmitExpenseClaim($id: ID!) { submitExpenseClaim(id: $id) { claim { id status } errors { message } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation WithdrawExpenseClaim($id: ID!) { withdrawExpenseClaim(id: $id) { claim { id status } errors { message } } }"): (typeof documents)["mutation WithdrawExpenseClaim($id: ID!) { withdrawExpenseClaim(id: $id) { claim { id status } errors { message } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DecideExpenseClaim($id: ID!, $action: String!, $note: String!) {\n    decideExpenseClaim(id: $id, action: $action, note: $note) { claim { id status stage } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation DecideExpenseClaim($id: ID!, $action: String!, $note: String!) {\n    decideExpenseClaim(id: $id, action: $action, note: $note) { claim { id status stage } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyExpenseClaims { myExpenseClaims { ...ClaimRowFields } expenseSettings { enabled payVia } }"): (typeof documents)["query MyExpenseClaims { myExpenseClaims { ...ClaimRowFields } expenseSettings { enabled payVia } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ExpensesToApprove { expensesToApprove { ...ClaimRowFields } }"): (typeof documents)["query ExpensesToApprove { expensesToApprove { ...ClaimRowFields } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ExpenseClaims($status: String, $search: String!) { expenseClaims(status: $status, search: $search) { ...ClaimRowFields } }\n"): (typeof documents)["\n  query ExpenseClaims($status: String, $search: String!) { expenseClaims(status: $status, search: $search) { ...ClaimRowFields } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateExpenseClaim($title: String!) { createExpenseClaim(title: $title) { claim { id } errors { field message } } }\n"): (typeof documents)["\n  mutation CreateExpenseClaim($title: String!) { createExpenseClaim(title: $title) { claim { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation MarkExpenseClaimsPaid($ids: [ID!]!, $reference: String!) { markExpenseClaimsPaid(ids: $ids, reference: $reference) }"): (typeof documents)["mutation MarkExpenseClaimsPaid($ids: [ID!]!, $reference: String!) { markExpenseClaimsPaid(ids: $ids, reference: $reference) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CompanyFolders {\n    companyFolders { id name fileCount }\n  }\n"): (typeof documents)["\n  query CompanyFolders {\n    companyFolders { id name fileCount }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CompanyFiles($folderId: ID, $search: String) {\n    companyFiles(folderId: $folderId, search: $search) {\n      id title originalName contentType size shared folderId uploadedBy createdAt requiresAcknowledgement acknowledgedByMe acknowledgedCount\n    }\n  }\n"): (typeof documents)["\n  query CompanyFiles($folderId: ID, $search: String) {\n    companyFiles(folderId: $folderId, search: $search) {\n      id title originalName contentType size shared folderId uploadedBy createdAt requiresAcknowledgement acknowledgedByMe acknowledgedCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveCompanyFolder($name: String!, $id: ID) {\n    saveCompanyFolder(name: $name, id: $id) { folder { id name } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveCompanyFolder($name: String!, $id: ID) {\n    saveCompanyFolder(name: $name, id: $id) { folder { id name } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCompanyFolder($id: ID!) {\n    deleteCompanyFolder(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteCompanyFolder($id: ID!) {\n    deleteCompanyFolder(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCompanyFile($input: UpdateCompanyFileInput!) {\n    updateCompanyFile(input: $input) { file { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation UpdateCompanyFile($input: UpdateCompanyFileInput!) {\n    updateCompanyFile(input: $input) { file { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveCompanyFiles($ids: [ID!]!) {\n    removeCompanyFiles(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation RemoveCompanyFiles($ids: [ID!]!) {\n    removeCompanyFiles(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AcknowledgeCompanyFile($id: ID!) { acknowledgeCompanyFile(id: $id) { id acknowledgedByMe } }\n"): (typeof documents)["\n  mutation AcknowledgeCompanyFile($id: ID!) { acknowledgeCompanyFile(id: $id) { id acknowledgedByMe } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query FileAcknowledgements($id: ID!) { fileAcknowledgements(id: $id) { name email acknowledgedAt } }\n"): (typeof documents)["\n  query FileAcknowledgements($id: ID!) { fileAcknowledgements(id: $id) { name email acknowledgedAt } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompanyFileDownloadUrl($id: ID!) {\n    companyFileDownloadUrl(id: $id)\n  }\n"): (typeof documents)["\n  mutation CompanyFileDownloadUrl($id: ID!) {\n    companyFileDownloadUrl(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeExpiring {\n    expiringDocuments(withinDays: 30) { id }\n  }\n"): (typeof documents)["\n  query HomeExpiring {\n    expiringDocuments(withinDays: 30) { id }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeMyPhoto($id: ID!) {\n    employee(id: $id) { id photoUrl }\n  }\n"): (typeof documents)["\n  query HomeMyPhoto($id: ID!) {\n    employee(id: $id) { id photoUrl }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveHomeLayout($widgets: JSON!) {\n    saveHomeLayout(widgets: $widgets) { key hidden }\n  }\n"): (typeof documents)["\n  mutation SaveHomeLayout($widgets: JSON!) {\n    saveHomeLayout(widgets: $widgets) { key hidden }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddMeAsEmployee { addMeAsEmployee { employee { id } errors { message } } }\n"): (typeof documents)["\n  mutation AddMeAsEmployee { addMeAsEmployee { employee { id } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeaveApprovals($everyone: Boolean!) {\n    leaveApprovals(everyone: $everyone) {\n      id startDate endDate halfDay days reason status createdAt canDecide decideAsOverride\n      employee { id fullName }\n      leaveType { id name color }\n      waitingFor { id fullName }\n      approvals { level status note overridden actedBy actedAt approver { id fullName } }\n    }\n    myDelegations { id startDate endDate delegator { id fullName } delegate { id fullName } }\n  }\n"): (typeof documents)["\n  query LeaveApprovals($everyone: Boolean!) {\n    leaveApprovals(everyone: $everyone) {\n      id startDate endDate halfDay days reason status createdAt canDecide decideAsOverride\n      employee { id fullName }\n      leaveType { id name color }\n      waitingFor { id fullName }\n      approvals { level status note overridden actedBy actedAt approver { id fullName } }\n    }\n    myDelegations { id startDate endDate delegator { id fullName } delegate { id fullName } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DecideLeave($input: DecideLeaveInput!) {\n    decideLeave(input: $input) {\n      request { id status }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation DecideLeave($input: DecideLeaveInput!) {\n    decideLeave(input: $input) {\n      request { id status }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DelegatePeople {\n    employees(filter: { statuses: [ACTIVE, PROBATION] }, first: 100) { nodes { id fullName } }\n  }\n"): (typeof documents)["\n  query DelegatePeople {\n    employees(filter: { statuses: [ACTIVE, PROBATION] }, first: 100) { nodes { id fullName } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DelegateApprovals($input: DelegateInput!) {\n    delegateApprovals(input: $input) { delegation { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation DelegateApprovals($input: DelegateInput!) {\n    delegateApprovals(input: $input) { delegation { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RevokeDelegation($id: ID!) {\n    revokeDelegation(id: $id) { delegation { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation RevokeDelegation($id: ID!) {\n    revokeDelegation(id: $id) { delegation { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeaveCalendar($start: Date!, $end: Date!, $departmentId: ID) {\n    leaveCalendar(start: $start, end: $end, departmentId: $departmentId) {\n      absences {\n        requestId startDate endDate halfDay status\n        employee { id fullName }\n        leaveType { id name color }\n      }\n      holidays { id name date location { name } }\n    }\n  }\n"): (typeof documents)["\n  query LeaveCalendar($start: Date!, $end: Date!, $departmentId: ID) {\n    leaveCalendar(start: $start, end: $end, departmentId: $departmentId) {\n      absences {\n        requestId startDate endDate halfDay status\n        employee { id fullName }\n        leaveType { id name color }\n      }\n      holidays { id name date location { name } }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CalendarDepartments {\n    departments { id name isActive }\n  }\n"): (typeof documents)["\n  query CalendarDepartments {\n    departments { id name isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UpcomingHolidays($year: Int!, $next: Int!) {\n    thisYear: publicHolidays(year: $year) { id name date location { name } }\n    nextYear: publicHolidays(year: $next) { id name date location { name } }\n  }\n"): (typeof documents)["\n  query UpcomingHolidays($year: Int!, $next: Int!) {\n    thisYear: publicHolidays(year: $year) { id name date location { name } }\n    nextYear: publicHolidays(year: $next) { id name date location { name } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PayrollHome {\n    payrollRuns { id payGroup currency periodStart periodEnd payDate status offCycle headcount gross net warnings published canApprove }\n    payGroups { id name frequency isActive supported }\n  }\n"): (typeof documents)["\n  query PayrollHome {\n    payrollRuns { id payGroup currency periodStart periodEnd payDate status offCycle headcount gross net warnings published canApprove }\n    payGroups { id name frequency isActive supported }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PayrollPeople {\n    payrollPeople { employeeId payGroupId taxState pensionProvider socialSecurityNumber nhfNumber contributesNhf pensionExempt annualRent annualLifeInsurance voluntaryPensionPercent }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName employeeNumber department { name } } }\n    payGroups { id name isActive }\n    payComponents { id name kind role isActive }\n  }\n"): (typeof documents)["\n  query PayrollPeople {\n    payrollPeople { employeeId payGroupId taxState pensionProvider socialSecurityNumber nhfNumber contributesNhf pensionExempt annualRent annualLifeInsurance voluntaryPensionPercent }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName employeeNumber department { name } } }\n    payGroups { id name isActive }\n    payComponents { id name kind role isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePayrollRun($group: ID!, $start: Date!, $offCycle: Boolean!, $note: String!) {\n    createPayrollRun(payGroupId: $group, periodStart: $start, offCycle: $offCycle, note: $note) { run { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation CreatePayrollRun($group: ID!, $start: Date!, $offCycle: Boolean!, $note: String!) {\n    createPayrollRun(payGroupId: $group, periodStart: $start, offCycle: $offCycle, note: $note) { run { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AssignPayGroup($ids: [ID!]!, $group: ID) { assignPayGroup(employeeIds: $ids, payGroupId: $group) }\n"): (typeof documents)["\n  mutation AssignPayGroup($ids: [ID!]!, $group: ID) { assignPayGroup(employeeIds: $ids, payGroupId: $group) }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SavePayrollProfile($input: PayrollProfileInput!) { savePayrollProfile(input: $input) { profile { employeeId } errors { field message } } }\n"): (typeof documents)["\n  mutation SavePayrollProfile($input: PayrollProfileInput!) { savePayrollProfile(input: $input) { profile { employeeId } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PayItems($id: ID!) { payItems(employeeId: $id) { id componentId component kind amount startDate endDate note } }\n"): (typeof documents)["\n  query PayItems($id: ID!) { payItems(employeeId: $id) { id componentId component kind amount startDate endDate note } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SavePayItem($input: PayItemInput!) { savePayItem(input: $input) { item { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SavePayItem($input: PayItemInput!) { savePayItem(input: $input) { item { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeletePayItem($id: ID!) { deletePayItem(id: $id) }"): (typeof documents)["mutation DeletePayItem($id: ID!) { deletePayItem(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PayrollRunDetail($id: ID!) {\n    payrollRun(id: $id) {\n      id payGroup currency periodStart periodEnd payDate status offCycle note createdBy submittedBy approvedBy published\n      headcount gross deductions net employerCost warnings canApprove\n      payslips { id employeeName employeeNumber gross totalDeductions net employerCost lines workings warnings daysPaid daysInPeriod rulePack }\n      variance { employeeId employeeName net previous change percent flag }\n    }\n  }\n"): (typeof documents)["\n  query PayrollRunDetail($id: ID!) {\n    payrollRun(id: $id) {\n      id payGroup currency periodStart periodEnd payDate status offCycle note createdBy submittedBy approvedBy published\n      headcount gross deductions net employerCost warnings canApprove\n      payslips { id employeeName employeeNumber gross totalDeductions net employerCost lines workings warnings daysPaid daysInPeriod rulePack }\n      variance { employeeId employeeName net previous change percent flag }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PayrollRunAction($id: ID!, $recalc: Boolean!, $submit: Boolean!, $approve: Boolean!, $publish: Boolean!, $paid: Boolean!, $cancel: Boolean!) {\n    recalculatePayrollRun(id: $id) @include(if: $recalc) { errors { message } }\n    submitPayrollRun(id: $id) @include(if: $submit) { errors { message } }\n    approvePayrollRun(id: $id) @include(if: $approve) { errors { message } }\n    publishPayslips(id: $id) @include(if: $publish) { errors { message } }\n    markPayrollPaid(id: $id) @include(if: $paid) { errors { message } }\n    cancelPayrollRun(id: $id) @include(if: $cancel) { errors { message } }\n  }\n"): (typeof documents)["\n  mutation PayrollRunAction($id: ID!, $recalc: Boolean!, $submit: Boolean!, $approve: Boolean!, $publish: Boolean!, $paid: Boolean!, $cancel: Boolean!) {\n    recalculatePayrollRun(id: $id) @include(if: $recalc) { errors { message } }\n    submitPayrollRun(id: $id) @include(if: $submit) { errors { message } }\n    approvePayrollRun(id: $id) @include(if: $approve) { errors { message } }\n    publishPayslips(id: $id) @include(if: $publish) { errors { message } }\n    markPayrollPaid(id: $id) @include(if: $paid) { errors { message } }\n    cancelPayrollRun(id: $id) @include(if: $cancel) { errors { message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendBackPayrollRun($id: ID!, $note: String!) { sendBackPayrollRun(id: $id, note: $note) { errors { message } } }\n"): (typeof documents)["\n  mutation SendBackPayrollRun($id: ID!, $note: String!) { sendBackPayrollRun(id: $id, note: $note) { errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyPayslips {\n    myPayslips { id periodStart periodEnd payDate currency gross totalDeductions net lines }\n  }\n"): (typeof documents)["\n  query MyPayslips {\n    myPayslips { id periodStart periodEnd payDate currency gross totalDeductions net lines }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CycleReviews($id: ID!) {\n    reviewCycle(id: $id) { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds\n      people selfDone managerDone shared }\n    cycleReviews(cycleId: $id) { ...ReviewRowFields calibrationNote }\n    reviewTemplates { id name isActive }\n    departments { id name }\n  }\n"): (typeof documents)["\n  query CycleReviews($id: ID!) {\n    reviewCycle(id: $id) { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds\n      people selfDone managerDone shared }\n    cycleReviews(cycleId: $id) { ...ReviewRowFields calibrationNote }\n    reviewTemplates { id name isActive }\n    departments { id name }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation LaunchReviewCycle($id: ID!) { launchReviewCycle(id: $id) { cycle { id status } errors { message } } }"): (typeof documents)["mutation LaunchReviewCycle($id: ID!) { launchReviewCycle(id: $id) { cycle { id status } errors { message } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CloseReviewCycle($id: ID!) { closeReviewCycle(id: $id) { cycle { id status } errors { message } } }"): (typeof documents)["mutation CloseReviewCycle($id: ID!) { closeReviewCycle(id: $id) { cycle { id status } errors { message } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteReviewCycle($id: ID!) { deleteReviewCycle(id: $id) }"): (typeof documents)["mutation DeleteReviewCycle($id: ID!) { deleteReviewCycle(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CalibrateFromCycle($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { id calibratedRating calibrationNote } }\n"): (typeof documents)["\n  mutation CalibrateFromCycle($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { id calibratedRating calibrationNote } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Goals($employeeId: ID) {\n    goals(employeeId: $employeeId) { ...GoalFields }\n    company: goals { ...GoalFields }\n    teamGoals { ...GoalFields }\n    myReports { id name jobTitle direct }\n  }\n"): (typeof documents)["\n  query Goals($employeeId: ID) {\n    goals(employeeId: $employeeId) { ...GoalFields }\n    company: goals { ...GoalFields }\n    teamGoals { ...GoalFields }\n    myReports { id name jobTitle direct }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query AlignableGoals($employeeId: ID) { alignableGoals(employeeId: $employeeId) { id title employeeName } }"): (typeof documents)["query AlignableGoals($employeeId: ID) { alignableGoals(employeeId: $employeeId) { id title employeeName } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GoalUpdates($id: ID!) { goal(id: $id) { id updates { id author progress status note createdAt } } }"): (typeof documents)["query GoalUpdates($id: ID!) { goal(id: $id) { id updates { id author progress status note createdAt } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveGoal($input: GoalInput!) { saveGoal(input: $input) { goal { ...GoalFields } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveGoal($input: GoalInput!) { saveGoal(input: $input) { goal { ...GoalFields } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CheckInGoal($input: GoalCheckInInput!) { checkInGoal(input: $input) { goal { ...GoalFields } errors { field message } } }\n"): (typeof documents)["\n  mutation CheckInGoal($input: GoalCheckInInput!) { checkInGoal(input: $input) { goal { ...GoalFields } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteGoal($id: ID!) { deleteGoal(id: $id) }"): (typeof documents)["mutation DeleteGoal($id: ID!) { deleteGoal(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyReviews { myReviews { ...ReviewRowFields } teamReviews { ...ReviewRowFields } }\n"): (typeof documents)["\n  query MyReviews { myReviews { ...ReviewRowFields } teamReviews { ...ReviewRowFields } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Feedback($employeeId: ID) {\n    feedback(employeeId: $employeeId) { id giverName recipientId recipientName body private mine createdAt }\n    myReports { id name direct }\n  }\n"): (typeof documents)["\n  query Feedback($employeeId: ID) {\n    feedback(employeeId: $employeeId) { id giverName recipientId recipientName body private mine createdAt }\n    myReports { id name direct }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GiveFeedback($recipientId: ID!, $body: String!, $private: Boolean) {\n    giveFeedback(recipientId: $recipientId, body: $body, private: $private) { feedback { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation GiveFeedback($recipientId: ID!, $body: String!, $private: Boolean) {\n    giveFeedback(recipientId: $recipientId, body: $body, private: $private) { feedback { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteFeedback($id: ID!) { deleteFeedback(id: $id) }"): (typeof documents)["mutation DeleteFeedback($id: ID!) { deleteFeedback(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OneOnOnes { oneOnOnes { id managerId managerName employeeId employeeName date agenda notes privateNotes actionItems myRole } myReports { id name direct } }\n"): (typeof documents)["\n  query OneOnOnes { oneOnOnes { id managerId managerName employeeId employeeName date agenda notes privateNotes actionItems myRole } myReports { id name direct } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveOneOnOne($input: OneOnOneInput!) { saveOneOnOne(input: $input) { oneOnOne { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveOneOnOne($input: OneOnOneInput!) { saveOneOnOne(input: $input) { oneOnOne { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteOneOnOne($id: ID!) { deleteOneOnOne(id: $id) }"): (typeof documents)["mutation DeleteOneOnOne($id: ID!) { deleteOneOnOne(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ReviewCycles {\n    reviewCycles { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds\n      people selfDone managerDone shared }\n    reviewTemplates { id name isActive }\n    departments { id name }\n  }\n"): (typeof documents)["\n  query ReviewCycles {\n    reviewCycles { id name kind status templateId templateName periodStart periodEnd selfDue managerDue includeSelf includePeers departmentIds employeeIds\n      people selfDone managerDone shared }\n    reviewTemplates { id name isActive }\n    departments { id name }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Review($id: ID!) {\n    review(id: $id) {\n      review { ...ReviewRowFields calibrationNote }\n      questions\n      responses { id role authorId authorName answers submittedAt declinedAt mine }\n      peers { id name status }\n      sharedAt acknowledgedAt employeeComment periodStart periodEnd includePeers canManage canCalibrate isEmployee\n    }\n  }\n"): (typeof documents)["\n  query Review($id: ID!) {\n    review(id: $id) {\n      review { ...ReviewRowFields calibrationNote }\n      questions\n      responses { id role authorId authorName answers submittedAt declinedAt mine }\n      peers { id name status }\n      sharedAt acknowledgedAt employeeComment periodStart periodEnd includePeers canManage canCalibrate isEmployee\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveReviewResponse($id: ID!, $answers: JSON!, $submit: Boolean) {\n    saveReviewResponse(id: $id, answers: $answers, submit: $submit) { response { id submittedAt } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveReviewResponse($id: ID!, $answers: JSON!, $submit: Boolean) {\n    saveReviewResponse(id: $id, answers: $answers, submit: $submit) { response { id submittedAt } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeclinePeerReview($id: ID!) { declinePeerReview(id: $id) }"): (typeof documents)["mutation DeclinePeerReview($id: ID!) { declinePeerReview(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestPeerReviews($reviewId: ID!, $employeeIds: [ID!]!) { requestPeerReviews(reviewId: $reviewId, employeeIds: $employeeIds) { peers { id } } }\n"): (typeof documents)["\n  mutation RequestPeerReviews($reviewId: ID!, $employeeIds: [ID!]!) { requestPeerReviews(reviewId: $reviewId, employeeIds: $employeeIds) { peers { id } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ShareReview($id: ID!) { shareReview(id: $id) { sharedAt } }"): (typeof documents)["mutation ShareReview($id: ID!) { shareReview(id: $id) { sharedAt } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AcknowledgeReview($id: ID!, $comment: String!) { acknowledgeReview(id: $id, comment: $comment) { acknowledgedAt } }"): (typeof documents)["mutation AcknowledgeReview($id: ID!, $comment: String!) { acknowledgeReview(id: $id, comment: $comment) { acknowledgedAt } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CalibrateReview($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { calibratedRating } }\n"): (typeof documents)["\n  mutation CalibrateReview($id: ID!, $rating: Int, $note: String!) { calibrateReview(id: $id, rating: $rating, note: $note) { calibratedRating } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RunReport($key: String!, $params: ReportParams) {\n    runReport(key: $key, params: $params) {\n      title chart note start end rows\n      columns { key label kind }\n      summary { label value }\n    }\n  }\n"): (typeof documents)["\n  query RunReport($key: String!, $params: ReportParams) {\n    runReport(key: $key, params: $params) {\n      title chart note start end rows\n      columns { key label kind }\n      summary { label value }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ReportFilterOptions {\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    departments { id name isActive }\n  }\n"): (typeof documents)["\n  query ReportFilterOptions {\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    departments { id name isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RunCustomReport($id: ID!) {\n    runCustomReport(id: $id) { title chart note rows columns { key label kind } summary { label value } }\n  }\n"): (typeof documents)["\n  query RunCustomReport($id: ID!) {\n    runCustomReport(id: $id) { title chart note rows columns { key label kind } summary { label value } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCustomReport($id: ID!) {\n    deleteCustomReport(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteCustomReport($id: ID!) {\n    deleteCustomReport(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmailAlertsAdmin {\n    emailAlerts { id name kind field daysBefore recipients enabled lastSentOn }\n    alertOptions { kinds { key label } dateFields { key label } recipientTypes { key label } }\n    roles { code name }\n    members { id fullName email isActive }\n  }\n"): (typeof documents)["\n  query EmailAlertsAdmin {\n    emailAlerts { id name kind field daysBefore recipients enabled lastSentOn }\n    alertOptions { kinds { key label } dateFields { key label } recipientTypes { key label } }\n    roles { code name }\n    members { id fullName email isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveEmailAlert($input: EmailAlertInput!) {\n    saveEmailAlert(input: $input) { alert { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveEmailAlert($input: EmailAlertInput!) {\n    saveEmailAlert(input: $input) { alert { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteEmailAlert($id: ID!) { deleteEmailAlert(id: $id) }"): (typeof documents)["mutation DeleteEmailAlert($id: ID!) { deleteEmailAlert(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SendEmailAlertNow($id: ID!) { sendEmailAlertNow(id: $id) }"): (typeof documents)["mutation SendEmailAlertNow($id: ID!) { sendEmailAlertNow(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ApprovalsSettings {\n    approvalChains { kind name enabled steps }\n    approvalStepTypes { key label }\n    roles { code name }\n    members { id fullName email isActive }\n  }\n"): (typeof documents)["\n  query ApprovalsSettings {\n    approvalChains { kind name enabled steps }\n    approvalStepTypes { key label }\n    roles { code name }\n    members { id fullName email isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveApprovalChain($kind: String!, $enabled: Boolean!, $steps: JSON!) {\n    saveApprovalChain(kind: $kind, enabled: $enabled, steps: $steps) { chain { kind } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveApprovalChain($kind: String!, $enabled: Boolean!, $steps: JSON!) {\n    saveApprovalChain(kind: $kind, enabled: $enabled, steps: $steps) { chain { kind } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AttendanceSetup {\n    attendanceSettings { enabled graceMinutes requireLocation overtimeAfterMinutes overtimeMultiplier payOvertime deductAbsence timesheetsEnabled }\n    shifts { id name start end breakMinutes weekdays isDefault isActive people }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }\n  }\n"): (typeof documents)["\n  query AttendanceSetup {\n    attendanceSettings { enabled graceMinutes requireLocation overtimeAfterMinutes overtimeMultiplier payOvertime deductAbsence timesheetsEnabled }\n    shifts { id name start end breakMinutes weekdays isDefault isActive people }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveAttendanceSettings($input: AttendanceSettingsInput!) { saveAttendanceSettings(input: $input) { enabled } }\n"): (typeof documents)["\n  mutation SaveAttendanceSettings($input: AttendanceSettingsInput!) { saveAttendanceSettings(input: $input) { enabled } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveShift($input: ShiftInput!) { saveShift(input: $input) { shift { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveShift($input: ShiftInput!) { saveShift(input: $input) { shift { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AssignShift($shift: ID!, $ids: [ID!]!, $start: Date!) { assignShift(shiftId: $shift, employeeIds: $ids, startDate: $start) }\n"): (typeof documents)["\n  mutation AssignShift($shift: ID!, $ids: [ID!]!, $start: Date!) { assignShift(shiftId: $shift, employeeIds: $ids, startDate: $start) }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AuditLog($search: String, $action: String, $from: String, $to: String, $offset: Int!) {\n    auditLog(search: $search, action: $action, dateFrom: $from, dateTo: $to, offset: $offset, limit: 50) {\n      hasMore\n      entries { id at actor action objectType objectId summary changes ipAddress }\n    }\n  }\n"): (typeof documents)["\n  query AuditLog($search: String, $action: String, $from: String, $to: String, $offset: Int!) {\n    auditLog(search: $search, action: $action, dateFrom: $from, dateTo: $to, offset: $offset, limit: 50) {\n      hasMore\n      entries { id at actor action objectType objectId summary changes ipAddress }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BenefitPlansSetup {\n    benefitPlans(includeInactive: true) {\n      id name kind provider description employeeRate employerRate basis statutory isActive enrolledCount\n    }\n  }\n"): (typeof documents)["\n  query BenefitPlansSetup {\n    benefitPlans(includeInactive: true) {\n      id name kind provider description employeeRate employerRate basis statutory isActive enrolledCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveBenefitPlan($input: SaveBenefitPlanInput!) {\n    saveBenefitPlan(input: $input) { plan { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveBenefitPlan($input: SaveBenefitPlanInput!) {\n    saveBenefitPlan(input: $input) { plan { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TaskTemplates {\n    taskTemplates { id kind title description category assignee dueOffset isActive appliesTo }\n    departments { id name isActive }\n    locations { id name isActive }\n  }\n"): (typeof documents)["\n  query TaskTemplates {\n    taskTemplates { id kind title description category assignee dueOffset isActive appliesTo }\n    departments { id name isActive }\n    locations { id name isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveTaskTemplate($input: SaveTaskTemplateInput!) {\n    saveTaskTemplate(input: $input) { template { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveTaskTemplate($input: SaveTaskTemplateInput!) {\n    saveTaskTemplate(input: $input) { template { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CompanySettings {\n    companySettings {\n      name country currency timezone primaryColor logoUrl requireAdminMfa sessionTimeoutMinutes ipAllowlist yourIp\n      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads payrollEnabled\n    }\n  }\n"): (typeof documents)["\n  query CompanySettings {\n    companySettings {\n      name country currency timezone primaryColor logoUrl requireAdminMfa sessionTimeoutMinutes ipAllowlist yourIp\n      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads payrollEnabled\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCompanySettings($input: CompanySettingsInput!) {\n    updateCompanySettings(input: $input) { settings { name } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation UpdateCompanySettings($input: CompanySettingsInput!) {\n    updateCompanySettings(input: $input) { settings { name } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveCompanyLogo { removeCompanyLogo }\n"): (typeof documents)["\n  mutation RemoveCompanyLogo { removeCompanyLogo }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DirectorySettingsAdmin {\n    directorySettings { directory orgChart roles fields }\n    directoryFieldChoices { key label }\n    roles { code name }\n  }\n"): (typeof documents)["\n  query DirectorySettingsAdmin {\n    directorySettings { directory orgChart roles fields }\n    directoryFieldChoices { key label }\n    roles { code name }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveDirectorySettings($settings: JSON!) {\n    saveDirectorySettings(settings: $settings) { directory }\n  }\n"): (typeof documents)["\n  mutation SaveDirectorySettings($settings: JSON!) {\n    saveDirectorySettings(settings: $settings) { directory }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ExpenseSetup {\n    expenseSettings { enabled managerApproval financeApproval receiptOver maxAgeDays payVia }\n    expenseCategories(includeInactive: true) { id name description accountCode limitPerItem limitPerMonth receiptRequired mileageRate isActive used }\n  }\n"): (typeof documents)["\n  query ExpenseSetup {\n    expenseSettings { enabled managerApproval financeApproval receiptOver maxAgeDays payVia }\n    expenseCategories(includeInactive: true) { id name description accountCode limitPerItem limitPerMonth receiptRequired mileageRate isActive used }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveExpenseSettings($input: ExpenseSettingsInput!) { saveExpenseSettings(input: $input) { enabled } }\n"): (typeof documents)["\n  mutation SaveExpenseSettings($input: ExpenseSettingsInput!) { saveExpenseSettings(input: $input) { enabled } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveExpenseCategory($input: ExpenseCategoryInput!) { saveExpenseCategory(input: $input) { category { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveExpenseCategory($input: ExpenseCategoryInput!) { saveExpenseCategory(input: $input) { category { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CustomFieldsAdmin {\n    customFields(includeInactive: true) { id name key fieldType choices helpText hrOnly position isActive }\n  }\n"): (typeof documents)["\n  query CustomFieldsAdmin {\n    customFields(includeInactive: true) { id name key fieldType choices helpText hrOnly position isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveCustomField($input: SaveCustomFieldInput!) {\n    saveCustomField(input: $input) { field { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveCustomField($input: SaveCustomFieldInput!) {\n    saveCustomField(input: $input) { field { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Organization {\n    legalEntities { id name registrationNumber country currency isActive }\n    locations { id name address city country timezone latitude longitude radiusM isActive legalEntity { id name } }\n    departments { id name code isActive legalEntity { id name } parent { id name } head { id fullName } }\n    jobTitles { id name description isActive }\n    grades { id name rank isActive payMin payMid payMax }\n    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }\n    aiWriting\n  }\n"): (typeof documents)["\n  query Organization {\n    legalEntities { id name registrationNumber country currency isActive }\n    locations { id name address city country timezone latitude longitude radiusM isActive legalEntity { id name } }\n    departments { id name code isActive legalEntity { id name } parent { id name } head { id fullName } }\n    jobTitles { id name description isActive }\n    grades { id name rank isActive payMin payMid payMax }\n    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }\n    aiWriting\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DraftJobDescription($title: String!, $notes: String!) { draftJobDescription(title: $title, notes: $notes) }\n"): (typeof documents)["\n  mutation DraftJobDescription($title: String!, $notes: String!) { draftJobDescription(title: $title, notes: $notes) }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveLegalEntity($input: SaveLegalEntityInput!) {\n    saveLegalEntity(input: $input) { legalEntity { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveLegalEntity($input: SaveLegalEntityInput!) {\n    saveLegalEntity(input: $input) { legalEntity { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveLocation($input: SaveLocationInput!) {\n    saveLocation(input: $input) { location { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveLocation($input: SaveLocationInput!) {\n    saveLocation(input: $input) { location { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveDepartment($input: SaveDepartmentInput!) {\n    saveDepartment(input: $input) { department { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveDepartment($input: SaveDepartmentInput!) {\n    saveDepartment(input: $input) { department { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveJobTitle($input: SaveJobTitleInput!) {\n    saveJobTitle(input: $input) { jobTitle { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveJobTitle($input: SaveJobTitleInput!) {\n    saveJobTitle(input: $input) { jobTitle { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveGrade($input: SaveGradeInput!) {\n    saveGrade(input: $input) { grade { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveGrade($input: SaveGradeInput!) {\n    saveGrade(input: $input) { grade { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PayrollSettings {\n    payGroups { id name legalEntityId legalEntity country currency frequency payDay anchorDate isActive memberCount supported }\n    payComponents { id code name kind role percentOfGross taxable pensionable isActive }\n    rulePacks { id country effectiveFrom name data source }\n    legalEntities { id name country isActive }\n  }\n"): (typeof documents)["\n  query PayrollSettings {\n    payGroups { id name legalEntityId legalEntity country currency frequency payDay anchorDate isActive memberCount supported }\n    payComponents { id code name kind role percentOfGross taxable pensionable isActive }\n    rulePacks { id country effectiveFrom name data source }\n    legalEntities { id name country isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SavePayGroup($input: PayGroupInput!) { savePayGroup(input: $input) { group { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SavePayGroup($input: PayGroupInput!) { savePayGroup(input: $input) { group { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SavePayComponent($input: PayComponentInput!) { savePayComponent(input: $input) { component { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SavePayComponent($input: PayComponentInput!) { savePayComponent(input: $input) { component { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ReviewTemplates { reviewTemplates { id name questions scale isActive cycles } }"): (typeof documents)["query ReviewTemplates { reviewTemplates { id name questions scale isActive cycles } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveReviewTemplate($input: ReviewTemplateInput!) { saveReviewTemplate(input: $input) { template { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveReviewTemplate($input: ReviewTemplateInput!) { saveReviewTemplate(input: $input) { template { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteReviewTemplate($id: ID!) { deleteReviewTemplate(id: $id) }"): (typeof documents)["mutation DeleteReviewTemplate($id: ID!) { deleteReviewTemplate(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeaveSetup($year: Int!) {\n    leaveTypes(includeInactive: true) { id name code color isPaid tracksBalance paidOutOnExit allowHalfDays approvalLevels isActive }\n    leavePolicies {\n      id name daysPerYear accrual proRata startsOn carryOverMax carryOverExpiryMonths employmentType isActive\n      leaveType { id name color }\n      legalEntity { id name }\n      location { id name }\n      grade { id name }\n      tenureRules { years extraDays }\n    }\n    publicHolidays(year: $year) { id name date location { id name } }\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    grades { id name isActive }\n  }\n"): (typeof documents)["\n  query LeaveSetup($year: Int!) {\n    leaveTypes(includeInactive: true) { id name code color isPaid tracksBalance paidOutOnExit allowHalfDays approvalLevels isActive }\n    leavePolicies {\n      id name daysPerYear accrual proRata startsOn carryOverMax carryOverExpiryMonths employmentType isActive\n      leaveType { id name color }\n      legalEntity { id name }\n      location { id name }\n      grade { id name }\n      tenureRules { years extraDays }\n    }\n    publicHolidays(year: $year) { id name date location { id name } }\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    grades { id name isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveLeaveType($input: SaveLeaveTypeInput!) {\n    saveLeaveType(input: $input) { leaveType { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveLeaveType($input: SaveLeaveTypeInput!) {\n    saveLeaveType(input: $input) { leaveType { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveLeavePolicy($input: SaveLeavePolicyInput!) {\n    saveLeavePolicy(input: $input) { policy { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveLeavePolicy($input: SaveLeavePolicyInput!) {\n    saveLeavePolicy(input: $input) { policy { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SavePublicHoliday($input: SavePublicHolidayInput!) {\n    savePublicHoliday(input: $input) { holiday { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SavePublicHoliday($input: SavePublicHolidayInput!) {\n    savePublicHoliday(input: $input) { holiday { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePublicHoliday($id: ID!) {\n    deletePublicHoliday(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeletePublicHoliday($id: ID!) {\n    deletePublicHoliday(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TrainingAdmin {\n    trainingCourses(includeInactive: true) { id name description category required frequencyMonths dueDays appliesTo isActive }\n    departments { id name isActive }\n    locations { id name isActive }\n  }\n"): (typeof documents)["\n  query TrainingAdmin {\n    trainingCourses(includeInactive: true) { id name description category required frequencyMonths dueDays appliesTo isActive }\n    departments { id name isActive }\n    locations { id name isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveTrainingCourse($input: TrainingCourseInput!) {\n    saveTrainingCourse(input: $input) { course { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveTrainingCourse($input: TrainingCourseInput!) {\n    saveTrainingCourse(input: $input) { course { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteTrainingCourse($id: ID!) { deleteTrainingCourse(id: $id) }"): (typeof documents)["mutation DeleteTrainingCourse($id: ID!) { deleteTrainingCourse(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UsersAdmin {\n    members {\n      id email firstName lastName fullName isActive invitePending lastLogin\n      roles { code name scope }\n      employee { id name }\n      legalEntities { id name }\n      locations { id name }\n      departments { id name }\n    }\n    roles { id code name scope permissions }\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    departments { id name isActive }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE, CANDIDATE] }) { nodes { id fullName } }\n  }\n"): (typeof documents)["\n  query UsersAdmin {\n    members {\n      id email firstName lastName fullName isActive invitePending lastLogin\n      roles { code name scope }\n      employee { id name }\n      legalEntities { id name }\n      locations { id name }\n      departments { id name }\n    }\n    roles { id code name scope permissions }\n    legalEntities { id name isActive }\n    locations { id name isActive }\n    departments { id name isActive }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE, CANDIDATE] }) { nodes { id fullName } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InviteMember($input: InviteMemberInput!) {\n    inviteMember(input: $input) { member { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation InviteMember($input: InviteMemberInput!) {\n    inviteMember(input: $input) { member { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMember($input: UpdateMemberInput!) {\n    updateMember(input: $input) { member { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation UpdateMember($input: UpdateMemberInput!) {\n    updateMember(input: $input) { member { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CorrectInvite($input: CorrectInviteInput!) {\n    correctInvite(input: $input) { member { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation CorrectInvite($input: CorrectInviteInput!) {\n    correctInvite(input: $input) { member { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelInvite($id: ID!) {\n    cancelInvite(id: $id) { errors { field message } }\n  }\n"): (typeof documents)["\n  mutation CancelInvite($id: ID!) {\n    cancelInvite(id: $id) { errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResendInvite($id: ID!) {\n    resendInvite(id: $id)\n  }\n"): (typeof documents)["\n  mutation ResendInvite($id: ID!) {\n    resendInvite(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n"): (typeof documents)["\n  mutation RequestPasswordReset($email: String!) {\n    requestPasswordReset(email: $email)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      mfaRequired\n      me { permissions }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      mfaRequired\n      me { permissions }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyMfa($code: String!) {\n    verifyMfa(code: $code) {\n      me { permissions }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyMfa($code: String!) {\n    verifyMfa(code: $code) {\n      me { permissions }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PasswordLink($uid: String!, $token: String!) {\n    passwordLink(uid: $uid, token: $token)\n  }\n"): (typeof documents)["\n  query PasswordLink($uid: String!, $token: String!) {\n    passwordLink(uid: $uid, token: $token)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetPassword($input: SetPasswordInput!) {\n    setPassword(input: $input) { ok errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SetPassword($input: SetPasswordInput!) {\n    setPassword(input: $input) { ok errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RedeemWelcome($token: String!) {\n    redeemWelcome(token: $token) { me { mfaSetupRequired } errors { message } }\n  }\n"): (typeof documents)["\n  mutation RedeemWelcome($token: String!) {\n    redeemWelcome(token: $token) { me { mfaSetupRequired } errors { message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SlugCheck($slug: String!) {\n    slugCheck(slug: $slug)\n  }\n"): (typeof documents)["\n  query SlugCheck($slug: String!) {\n    slugCheck(slug: $slug)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) { url codeSentTo errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) { url codeSentTo errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SignupEmailCheck($email: String!) {\n    signupEmailCheck(email: $email) { problem freeWebmail }\n  }\n"): (typeof documents)["\n  query SignupEmailCheck($email: String!) {\n    signupEmailCheck(email: $email) { problem freeWebmail }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WaitingApprovals {\n    leaveApprovals { id }\n    pendingChanges { id canDecide }\n  }\n"): (typeof documents)["\n  query WaitingApprovals {\n    leaveApprovals { id }\n    pendingChanges { id canDecide }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StopViewAs { stopViewAs { permissions } }\n"): (typeof documents)["\n  mutation StopViewAs { stopViewAs { permissions } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GlobalSearch($q: String!) {\n    search(q: $q) { kind title subtitle href photoUrl }\n  }\n"): (typeof documents)["\n  query GlobalSearch($q: String!) {\n    search(q: $q) { kind title subtitle href photoUrl }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NotificationList($first: Int!, $after: String) {\n    unreadNotificationCount\n    notifications(first: $first, after: $after) {\n      nodes { id kind title body link read createdAt }\n      pageInfo { hasNextPage endCursor }\n    }\n  }\n"): (typeof documents)["\n  query NotificationList($first: Int!, $after: String) {\n    unreadNotificationCount\n    notifications(first: $first, after: $after) {\n      nodes { id kind title body link read createdAt }\n      pageInfo { hasNextPage endCursor }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n"): (typeof documents)["\n  query UnreadNotificationCount {\n    unreadNotificationCount\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation MarkNotificationsRead($ids: [ID!]) {\n    markNotificationsRead(ids: $ids)\n  }\n"): (typeof documents)["\n  mutation MarkNotificationsRead($ids: [ID!]) {\n    markNotificationsRead(ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query PushPublicKey { pushPublicKey }"): (typeof documents)["query PushPublicKey { pushPublicKey }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SavePushSubscription($endpoint: String!, $p256dh: String!, $auth: String!, $userAgent: String!) {\n    savePushSubscription(endpoint: $endpoint, p256dh: $p256dh, auth: $auth, userAgent: $userAgent)\n  }\n"): (typeof documents)["\n  mutation SavePushSubscription($endpoint: String!, $p256dh: String!, $auth: String!, $userAgent: String!) {\n    savePushSubscription(endpoint: $endpoint, p256dh: $p256dh, auth: $auth, userAgent: $userAgent)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RemovePushSubscription($endpoint: String!) { removePushSubscription(endpoint: $endpoint) }"): (typeof documents)["mutation RemovePushSubscription($endpoint: String!) { removePushSubscription(endpoint: $endpoint) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PendingPayJobChanges {\n    pendingChanges { id kind kindName employeeId employeeName summary status step stepCount requestedBy createdAt canDecide canCancel }\n  }\n"): (typeof documents)["\n  query PendingPayJobChanges {\n    pendingChanges { id kind kindName employeeId employeeName summary status step stepCount requestedBy createdAt canDecide canCancel }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DecidePendingChange($id: ID!, $approve: Boolean!, $note: String) {\n    decidePendingChange(id: $id, approve: $approve, note: $note) { change { id status } errors { message } }\n  }\n"): (typeof documents)["\n  mutation DecidePendingChange($id: ID!, $approve: Boolean!, $note: String) {\n    decidePendingChange(id: $id, approve: $approve, note: $note) { change { id status } errors { message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelPendingChange($id: ID!) {\n    cancelPendingChange(id: $id) { change { id status } errors { message } }\n  }\n"): (typeof documents)["\n  mutation CancelPendingChange($id: ID!) {\n    cancelPendingChange(id: $id) { change { id status } errors { message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyClock {\n    myAttendance(days: 1) { enabled shift shiftStart shiftEnd geofenced clockedIn { id clockIn } }\n  }\n"): (typeof documents)["\n  query MyClock {\n    myAttendance(days: 1) { enabled shift shiftStart shiftEnd geofenced clockedIn { id clockIn } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PillClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }\n"): (typeof documents)["\n  mutation PillClockIn($lat: Decimal, $lng: Decimal) { clockIn(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PillClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }\n"): (typeof documents)["\n  mutation PillClockOut($lat: Decimal, $lng: Decimal) { clockOut(latitude: $lat, longitude: $lng) { entry { id } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Projects { projects { id name code client costCentre billable employeeIds isActive } }\n"): (typeof documents)["\n  query Projects { projects { id name code client costCentre billable employeeIds isActive } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveProject($input: ProjectInput!) { saveProject(input: $input) { project { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveProject($input: ProjectInput!) { saveProject(input: $input) { project { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TimesheetFields on Timesheet {\n    id employeeId employeeName weekStart status submittedAt decidedBy decidedAt note totalMinutes mine canApprove\n    entries { projectId projectName date minutes note }\n    clocked { date minutes }\n  }\n"): (typeof documents)["\n  fragment TimesheetFields on Timesheet {\n    id employeeId employeeName weekStart status submittedAt decidedBy decidedAt note totalMinutes mine canApprove\n    entries { projectId projectName date minutes note }\n    clocked { date minutes }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyTimesheet($week: Date!) { myTimesheet(weekStart: $week) { ...TimesheetFields } myProjects { id name code client } }\n"): (typeof documents)["\n  query MyTimesheet($week: Date!) { myTimesheet(weekStart: $week) { ...TimesheetFields } myProjects { id name code client } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveTimesheet($week: Date!, $entries: [TimesheetCellInput!]!) {\n    saveTimesheet(weekStart: $week, entries: $entries) { timesheet { ...TimesheetFields } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveTimesheet($week: Date!, $entries: [TimesheetCellInput!]!) {\n    saveTimesheet(weekStart: $week, entries: $entries) { timesheet { ...TimesheetFields } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SubmitTimesheet($week: Date!) { submitTimesheet(weekStart: $week) { timesheet { ...TimesheetFields } errors { message } } }\n"): (typeof documents)["\n  mutation SubmitTimesheet($week: Date!) { submitTimesheet(weekStart: $week) { timesheet { ...TimesheetFields } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query TimesheetsToApprove { timesheetsToApprove { ...TimesheetFields } }"): (typeof documents)["query TimesheetsToApprove { timesheetsToApprove { ...TimesheetFields } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query TeamTimesheets($week: Date!) { teamTimesheets(weekStart: $week) { ...TimesheetFields } }"): (typeof documents)["query TeamTimesheets($week: Date!) { teamTimesheets(weekStart: $week) { ...TimesheetFields } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DecideTimesheet($id: ID!, $approve: Boolean!, $note: String!) {\n    decideTimesheet(id: $id, approve: $approve, note: $note) { timesheet { id status } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation DecideTimesheet($id: ID!, $approve: Boolean!, $note: String!) {\n    decideTimesheet(id: $id, approve: $approve, note: $note) { timesheet { id status } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReopenTimesheet($id: ID!, $note: String!) { reopenTimesheet(id: $id, note: $note) { timesheet { id status } errors { message } } }\n"): (typeof documents)["\n  mutation ReopenTimesheet($id: ID!, $note: String!) { reopenTimesheet(id: $id, note: $note) { timesheet { id status } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EmailMyCompanies($email: String!) {\n    emailMyCompanies(email: $email)\n  }\n"): (typeof documents)["\n  mutation EmailMyCompanies($email: String!) {\n    emailMyCompanies(email: $email)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeDocuments($employeeId: ID!) {\n    employeeDocuments(employeeId: $employeeId) {\n      id title originalName contentType size expiresOn notes uploadedBy createdAt\n      category { id name requiresExpiry employeeCanView managerCanView }\n    }\n  }\n"): (typeof documents)["\n  query EmployeeDocuments($employeeId: ID!) {\n    employeeDocuments(employeeId: $employeeId) {\n      id title originalName contentType size expiresOn notes uploadedBy createdAt\n      category { id name requiresExpiry employeeCanView managerCanView }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DocumentCategoryOptions {\n    documentCategories { id name requiresExpiry employeeCanView managerCanView isActive }\n  }\n"): (typeof documents)["\n  query DocumentCategoryOptions {\n    documentCategories { id name requiresExpiry employeeCanView managerCanView isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DocumentDownloadUrl($id: ID!) {\n    documentDownloadUrl(id: $id)\n  }\n"): (typeof documents)["\n  mutation DocumentDownloadUrl($id: ID!) {\n    documentDownloadUrl(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDocument($input: UpdateDocumentInput!) {\n    updateDocument(input: $input) { document { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation UpdateDocument($input: UpdateDocumentInput!) {\n    updateDocument(input: $input) { document { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveDocument($id: ID!) {\n    removeDocument(id: $id)\n  }\n"): (typeof documents)["\n  mutation RemoveDocument($id: ID!) {\n    removeDocument(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DocumentsAdmin($within: Int!) {\n    expiringDocuments(withinDays: $within) {\n      id title expiresOn\n      employee { id fullName }\n      category { id name }\n    }\n    documentCategories(includeInactive: true) { id name employeeCanView managerCanView requiresExpiry isActive }\n  }\n"): (typeof documents)["\n  query DocumentsAdmin($within: Int!) {\n    expiringDocuments(withinDays: $within) {\n      id title expiresOn\n      employee { id fullName }\n      category { id name }\n    }\n    documentCategories(includeInactive: true) { id name employeeCanView managerCanView requiresExpiry isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveDocumentCategory($input: SaveDocumentCategoryInput!) {\n    saveDocumentCategory(input: $input) { category { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveDocumentCategory($input: SaveDocumentCategoryInput!) {\n    saveDocumentCategory(input: $input) { category { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEmployee($input: UpdateEmployeeInput!) {\n    updateEmployee(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateEmployee($input: UpdateEmployeeInput!) {\n    updateEmployee(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query JobOptions {\n    legalEntities { id name isActive }\n    departments { id name isActive legalEntity { id } }\n    locations { id name isActive legalEntity { id } }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }\n  }\n"): (typeof documents)["\n  query JobOptions {\n    legalEntities { id name isActive }\n    departments { id name isActive legalEntity { id } }\n    locations { id name isActive legalEntity { id } }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    employees(filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }, first: 100) { nodes { id fullName } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestJobChange($input: ChangeJobInput!) {\n    requestJobChange(input: $input) { waitingForApproval errors { field message } }\n  }\n"): (typeof documents)["\n  mutation RequestJobChange($input: ChangeJobInput!) {\n    requestJobChange(input: $input) { waitingForApproval errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestPayChange($input: ChangeCompensationInput!) {\n    requestPayChange(input: $input) { waitingForApproval errors { field message } }\n  }\n"): (typeof documents)["\n  mutation RequestPayChange($input: ChangeCompensationInput!) {\n    requestPayChange(input: $input) { waitingForApproval errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ChangeEmployeeJob($input: ChangeJobInput!) {\n    changeEmployeeJob(input: $input) {\n      employee { id }\n      waitingForApproval\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation ChangeEmployeeJob($input: ChangeJobInput!) {\n    changeEmployeeJob(input: $input) {\n      employee { id }\n      waitingForApproval\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ChangeEmployeeCompensation($input: ChangeCompensationInput!) {\n    changeEmployeeCompensation(input: $input) {\n      employee { id }\n      waitingForApproval\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation ChangeEmployeeCompensation($input: ChangeCompensationInput!) {\n    changeEmployeeCompensation(input: $input) {\n      employee { id }\n      waitingForApproval\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ChangeEmployeeStatus($input: ChangeStatusInput!) {\n    changeEmployeeStatus(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation ChangeEmployeeStatus($input: ChangeStatusInput!) {\n    changeEmployeeStatus(input: $input) {\n      employee { id }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveEmergencyContact($input: EmergencyContactInput!) {\n    saveEmergencyContact(input: $input) { contact { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveEmergencyContact($input: EmergencyContactInput!) {\n    saveEmergencyContact(input: $input) { contact { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteEmergencyContact($id: ID!) {\n    deleteEmergencyContact(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmergencyContact($id: ID!) {\n    deleteEmergencyContact(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RevealPrivateDetails($employeeId: ID!) {\n    revealPrivateDetails(employeeId: $employeeId) { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }\n  }\n"): (typeof documents)["\n  mutation RevealPrivateDetails($employeeId: ID!) {\n    revealPrivateDetails(employeeId: $employeeId) { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SavePrivateDetails($input: PrivateDetailsInput!) {\n    savePrivateDetails(input: $input) { details { masked } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SavePrivateDetails($input: PrivateDetailsInput!) {\n    savePrivateDetails(input: $input) { details { masked } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetEmployeeCustomValues($employeeId: ID!, $values: JSON!) {\n    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SetEmployeeCustomValues($employeeId: ID!, $values: JSON!) {\n    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyChangeRequests {\n    myChangeRequests { id status note createdAt decidedAt decidedBy lines { field label current requested } }\n  }\n"): (typeof documents)["\n  query MyChangeRequests {\n    myChangeRequests { id status note createdAt decidedAt decidedBy lines { field label current requested } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMyDetails($input: MyDetailsInput!) {\n    updateMyDetails(input: $input) { applied request { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation UpdateMyDetails($input: MyDetailsInput!) {\n    updateMyDetails(input: $input) { applied request { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelChangeRequest($id: ID!) {\n    cancelChangeRequest(id: $id) { request { id status } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation CancelChangeRequest($id: ID!) {\n    cancelChangeRequest(id: $id) { request { id status } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ClaimRowFields on ExpenseClaim {\n    id title employeeId employeeName department currency total status stage approverName submittedAt approvedAt paidAt payVia\n    paymentReference payrollPeriod linesCount flags mine canDecide canPay createdAt\n  }\n"): (typeof documents)["\n  fragment ClaimRowFields on ExpenseClaim {\n    id title employeeId employeeName department currency total status stage approverName submittedAt approvedAt paidAt payVia\n    paymentReference payrollPeriod linesCount flags mine canDecide canPay createdAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WidgetFilters {\n    widgetFilters { key label options { value label } }\n  }\n"): (typeof documents)["\n  query WidgetFilters {\n    widgetFilters { key label options { value label } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PendingTimeOff($filter: WidgetFilter) {\n    pendingTimeOff(filter: $filter) {\n      id approverName startDate endDate days leaveType submittedAt urgent\n      person { id fullName photoUrl }\n    }\n  }\n"): (typeof documents)["\n  query PendingTimeOff($filter: WidgetFilter) {\n    pendingTimeOff(filter: $filter) {\n      id approverName startDate endDate days leaveType submittedAt urgent\n      person { id fullName photoUrl }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TimeOffUsedWidget($leaveTypeId: ID!, $filter: WidgetFilter) {\n    timeOffUsed(leaveTypeId: $leaveTypeId, filter: $filter) {\n      total people\n      months { month value }\n      previousYear { month value }\n    }\n  }\n"): (typeof documents)["\n  query TimeOffUsedWidget($leaveTypeId: ID!, $filter: WidgetFilter) {\n    timeOffUsed(leaveTypeId: $leaveTypeId, filter: $filter) {\n      total people\n      months { month value }\n      previousYear { month value }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TimeOffUsedTypes {\n    leaveTypes { id name }\n  }\n"): (typeof documents)["\n  query TimeOffUsedTypes {\n    leaveTypes { id name }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LocationWidget($filter: WidgetFilter) {\n    locationBreakdown(filter: $filter) {\n      total\n      current { label value }\n      history { month values { label value } }\n    }\n  }\n"): (typeof documents)["\n  query LocationWidget($filter: WidgetFilter) {\n    locationBreakdown(filter: $filter) {\n      total\n      current { label value }\n      history { month values { label value } }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PayRaiseWidget($filter: WidgetFilter) {\n    withoutPayRaise(filter: $filter) {\n      count\n      people { hireDate lastRaise amount currency person { id fullName jobTitle } }\n    }\n  }\n"): (typeof documents)["\n  query PayRaiseWidget($filter: WidgetFilter) {\n    withoutPayRaise(filter: $filter) {\n      count\n      people { hireDate lastRaise amount currency person { id fullName jobTitle } }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyReminders($employeeId: ID) {\n    myReminders(employeeId: $employeeId) { id text dueOn doneAt employee { id fullName } }\n  }\n"): (typeof documents)["\n  query MyReminders($employeeId: ID) {\n    myReminders(employeeId: $employeeId) { id text dueOn doneAt employee { id fullName } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateReminder($input: ReminderInput!) { createReminder(input: $input) { reminder { id } errors { field message } } }\n"): (typeof documents)["\n  mutation CreateReminder($input: ReminderInput!) { createReminder(input: $input) { reminder { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SnoozeReminder($id: ID!, $dueOn: Date) { updateReminder(id: $id, dueOn: $dueOn) { reminder { id dueOn } errors { message } } }\n"): (typeof documents)["\n  mutation SnoozeReminder($id: ID!, $dueOn: Date) { updateReminder(id: $id, dueOn: $dueOn) { reminder { id dueOn } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CompleteReminder($id: ID!, $done: Boolean!) { completeReminder(id: $id, done: $done) { reminder { id doneAt } errors { message } } }\n"): (typeof documents)["\n  mutation CompleteReminder($id: ID!, $done: Boolean!) { completeReminder(id: $id, done: $done) { reminder { id doneAt } errors { message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteReminder($id: ID!) { deleteReminder(id: $id) }\n"): (typeof documents)["\n  mutation DeleteReminder($id: ID!) { deleteReminder(id: $id) }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeData {\n    home {\n      setup { percent steps { key label why href done group } }\n      myProfile { percent missing { key label tab critical why } }\n      dataGaps { key label why count people { id fullName jobTitle photoUrl } }\n      celebrations { kind date years person { id fullName jobTitle photoUrl } }\n      newHires { hireDate person { id fullName jobTitle photoUrl } }\n      myStuff { trainings certifications certificationsExpiring benefits openTasks }\n      directReports {\n        notes outToday department location timezone workEmail workPhone workPhoneExt\n        events { kind label date }\n        person { id fullName jobTitle photoUrl }\n      }\n      insights {\n        months { month headcount additions terminations voluntary involuntary other turnoverRate }\n        headcount change changePercent additions terminations turnoverRate\n        byLocation { label value } byDepartment { label value } byEmploymentType { label value }\n        byGender { label value } byAge { label value } benefitEnrollments { label value }\n        expiringCertifications { name people soonest }\n        pendingUrgent pendingOther withoutPayRaise\n        onboarding { inProgress withOverdue starting { date people { id fullName jobTitle photoUrl } } }\n      }\n    }\n    announcements(limit: 20) { id title body authorName publishedAt pinned }\n    companyLinks { id group label url }\n    homeLayout { key hidden }\n    dismissedFeed\n  }\n"): (typeof documents)["\n  query HomeData {\n    home {\n      setup { percent steps { key label why href done group } }\n      myProfile { percent missing { key label tab critical why } }\n      dataGaps { key label why count people { id fullName jobTitle photoUrl } }\n      celebrations { kind date years person { id fullName jobTitle photoUrl } }\n      newHires { hireDate person { id fullName jobTitle photoUrl } }\n      myStuff { trainings certifications certificationsExpiring benefits openTasks }\n      directReports {\n        notes outToday department location timezone workEmail workPhone workPhoneExt\n        events { kind label date }\n        person { id fullName jobTitle photoUrl }\n      }\n      insights {\n        months { month headcount additions terminations voluntary involuntary other turnoverRate }\n        headcount change changePercent additions terminations turnoverRate\n        byLocation { label value } byDepartment { label value } byEmploymentType { label value }\n        byGender { label value } byAge { label value } benefitEnrollments { label value }\n        expiringCertifications { name people soonest }\n        pendingUrgent pendingOther withoutPayRaise\n        onboarding { inProgress withOverdue starting { date people { id fullName jobTitle photoUrl } } }\n      }\n    }\n    announcements(limit: 20) { id title body authorName publishedAt pinned }\n    companyLinks { id group label url }\n    homeLayout { key hidden }\n    dismissedFeed\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectedLeave($leaveTypeId: ID!, $on: Date!) {\n    projectedLeaveBalance(leaveTypeId: $leaveTypeId, on: $on) { balance pending available }\n  }\n"): (typeof documents)["\n  query ProjectedLeave($leaveTypeId: ID!, $on: Date!) {\n    projectedLeaveBalance(leaveTypeId: $leaveTypeId, on: $on) { balance pending available }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeApprovals {\n    leaveApprovals { id startDate endDate days createdAt canDecide employee { id fullName photoUrl } leaveType { name color } }\n  }\n"): (typeof documents)["\n  query HomeApprovals {\n    leaveApprovals { id startDate endDate days createdAt canDecide employee { id fullName photoUrl } leaveType { name color } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeChanges {\n    pendingChangeRequests { id employeeId employeeName createdAt canDecide }\n  }\n"): (typeof documents)["\n  query HomeChanges {\n    pendingChangeRequests { id employeeId employeeName createdAt canDecide }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation HomeDecideLeave($input: DecideLeaveInput!) {\n    decideLeave(input: $input) { request { id status } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation HomeDecideLeave($input: DecideLeaveInput!) {\n    decideLeave(input: $input) { request { id status } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DismissFeedItem($key: String!) {\n    dismissFeedItem(key: $key)\n  }\n"): (typeof documents)["\n  mutation DismissFeedItem($key: String!) {\n    dismissFeedItem(key: $key)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveAnnouncement($input: AnnouncementInput!) {\n    saveAnnouncement(input: $input) { announcement { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveAnnouncement($input: AnnouncementInput!) {\n    saveAnnouncement(input: $input) { announcement { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteAnnouncement($id: ID!) {\n    deleteAnnouncement(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteAnnouncement($id: ID!) {\n    deleteAnnouncement(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeWhosOut($day: Date!) {\n    leaveCalendar(start: $day, end: $day) { absences { requestId status employee { id fullName photoUrl } leaveType { name } } }\n  }\n"): (typeof documents)["\n  query HomeWhosOut($day: Date!) {\n    leaveCalendar(start: $day, end: $day) { absences { requestId status employee { id fullName photoUrl } leaveType { name } } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveCompanyLinks($links: [CompanyLinkInput!]!) {\n    saveCompanyLinks(links: $links) { links { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveCompanyLinks($links: [CompanyLinkInput!]!) {\n    saveCompanyLinks(links: $links) { links { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeHolidays($year: Int!, $next: Int!) {\n    thisYear: publicHolidays(year: $year) { id name date location { name } }\n    nextYear: publicHolidays(year: $next) { id name date location { name } }\n  }\n"): (typeof documents)["\n  query HomeHolidays($year: Int!, $next: Int!) {\n    thisYear: publicHolidays(year: $year) { id name date location { name } }\n    nextYear: publicHolidays(year: $next) { id name date location { name } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeLeave($employeeId: ID) {\n    employeeLeave(employeeId: $employeeId) {\n      employee { id fullName }\n      balances {\n        leaveType { id name color tracksBalance allowHalfDays isPaid }\n        policyName entitlement balance pending available takenThisYear\n      }\n      requests {\n        id startDate endDate halfDay days reason status createdAt canCancel canDecide\n        leaveType { id name color }\n        approvals { level status note overridden actedBy actedAt approver { id fullName } }\n      }\n      ledger { id date kind amount reason leaveType { name } }\n    }\n  }\n"): (typeof documents)["\n  query EmployeeLeave($employeeId: ID) {\n    employeeLeave(employeeId: $employeeId) {\n      employee { id fullName }\n      balances {\n        leaveType { id name color tracksBalance allowHalfDays isPaid }\n        policyName entitlement balance pending available takenThisYear\n      }\n      requests {\n        id startDate endDate halfDay days reason status createdAt canCancel canDecide\n        leaveType { id name color }\n        approvals { level status note overridden actedBy actedAt approver { id fullName } }\n      }\n      ledger { id date kind amount reason leaveType { name } }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CancelLeave($id: ID!) {\n    cancelLeave(id: $id) {\n      request { id status }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation CancelLeave($id: ID!) {\n    cancelLeave(id: $id) {\n      request { id status }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeaveQuote($leaveTypeId: ID!, $startDate: Date!, $endDate: Date!, $halfDay: Boolean!, $employeeId: ID) {\n    leaveQuote(leaveTypeId: $leaveTypeId, startDate: $startDate, endDate: $endDate, halfDay: $halfDay, employeeId: $employeeId) {\n      days available availableAfter\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  query LeaveQuote($leaveTypeId: ID!, $startDate: Date!, $endDate: Date!, $halfDay: Boolean!, $employeeId: ID) {\n    leaveQuote(leaveTypeId: $leaveTypeId, startDate: $startDate, endDate: $endDate, halfDay: $halfDay, employeeId: $employeeId) {\n      days available availableAfter\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestLeave($input: RequestLeaveInput!) {\n    requestLeave(input: $input) {\n      request { id status }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation RequestLeave($input: RequestLeaveInput!) {\n    requestLeave(input: $input) {\n      request { id status }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdjustLeaveBalance($input: AdjustLeaveInput!) {\n    adjustLeaveBalance(input: $input) {\n      balance { balance }\n      errors { field message }\n    }\n  }\n"): (typeof documents)["\n  mutation AdjustLeaveBalance($input: AdjustLeaveInput!) {\n    adjustLeaveBalance(input: $input) {\n      balance { balance }\n      errors { field message }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PayrollLoans {\n    loans { id employeeId employeeName kind amount instalment firstDeduction reason status outstanding repaid }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }\n  }\n"): (typeof documents)["\n  query PayrollLoans {\n    loans { id employeeId employeeName kind amount instalment firstDeduction reason status outstanding repaid }\n    employees(first: 100, filter: { statuses: [ACTIVE, PROBATION, ON_LEAVE] }) { nodes { id fullName } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveLoan($input: LoanInput!) { saveLoan(input: $input) { loan { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveLoan($input: LoanInput!) { saveLoan(input: $input) { loan { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CloseLoan($id: ID!, $repaid: Boolean!) { closeLoan(id: $id, repaid: $repaid) { id status } }\n"): (typeof documents)["\n  mutation CloseLoan($id: ID!, $repaid: Boolean!) { closeLoan(id: $id, repaid: $repaid) { id status } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyLoans { myLoans { id kind amount outstanding status } }\n"): (typeof documents)["\n  query MyLoans { myLoans { id kind amount outstanding status } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PeopleList($filter: EmployeeFilter, $first: Int, $after: String, $sort: String, $descending: Boolean!) {\n    employees(filter: $filter, first: $first, after: $after, sort: $sort, descending: $descending) {\n      totalCount\n      pageInfo { hasNextPage endCursor }\n      nodes {\n        id employeeNumber firstName lastName preferredName fullName photoUrl status employmentType hireDate\n        workEmail workPhone workPhoneExt phone gender dateOfBirth\n        jobTitle { name } department { name } location { name } legalEntity { name } grade { name } manager { fullName }\n      }\n    }\n  }\n"): (typeof documents)["\n  query PeopleList($filter: EmployeeFilter, $first: Int, $after: String, $sort: String, $descending: Boolean!) {\n    employees(filter: $filter, first: $first, after: $after, sort: $sort, descending: $descending) {\n      totalCount\n      pageInfo { hasNextPage endCursor }\n      nodes {\n        id employeeNumber firstName lastName preferredName fullName photoUrl status employmentType hireDate\n        workEmail workPhone workPhoneExt phone gender dateOfBirth\n        jobTitle { name } department { name } location { name } legalEntity { name } grade { name } manager { fullName }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PeopleFilterOptions {\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    teams { id name isActive }\n    employeeViews { id name filter columns }\n  }\n"): (typeof documents)["\n  query PeopleFilterOptions {\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    teams { id name isActive }\n    employeeViews { id name filter columns }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SavePeopleView($input: EmployeeViewInput!) {\n    saveEmployeeView(input: $input) { view { id name } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SavePeopleView($input: EmployeeViewInput!) {\n    saveEmployeeView(input: $input) { view { id name } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePeopleView($id: ID!) {\n    deleteEmployeeView(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeletePeopleView($id: ID!) {\n    deleteEmployeeView(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PowerEditPeople($filter: EmployeeFilter, $first: Int, $after: String) {\n    employees(filter: $filter, first: $first, after: $after, sort: \"name\") {\n      totalCount\n      pageInfo { hasNextPage endCursor }\n      nodes {\n        id employeeNumber firstName middleName lastName preferredName fullName photoUrl status employmentType\n        workEmail personalEmail phone workPhone workPhoneExt dateOfBirth gender maritalStatus\n        jobTitle { id name } department { id name } location { id name } legalEntity { id name } grade { id name } manager { id fullName }\n        personal { nationality linkedinUrl homePhone addressLine1 addressLine2 city state postalCode country }\n        customValues { field { key } value }\n      }\n    }\n  }\n"): (typeof documents)["\n  query PowerEditPeople($filter: EmployeeFilter, $first: Int, $after: String) {\n    employees(filter: $filter, first: $first, after: $after, sort: \"name\") {\n      totalCount\n      pageInfo { hasNextPage endCursor }\n      nodes {\n        id employeeNumber firstName middleName lastName preferredName fullName photoUrl status employmentType\n        workEmail personalEmail phone workPhone workPhoneExt dateOfBirth gender maritalStatus\n        jobTitle { id name } department { id name } location { id name } legalEntity { id name } grade { id name } manager { id fullName }\n        personal { nationality linkedinUrl homePhone addressLine1 addressLine2 city state postalCode country }\n        customValues { field { key } value }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PowerEditLookups {\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    customFields { key name fieldType choices }\n    orgChart { id fullName }\n  }\n"): (typeof documents)["\n  query PowerEditLookups {\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n    customFields { key name fieldType choices }\n    orgChart { id fullName }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PowerEdit($input: PowerEditInput!) {\n    powerEdit(input: $input) { employeeId fullName ok errors { field message } }\n  }\n"): (typeof documents)["\n  mutation PowerEdit($input: PowerEditInput!) {\n    powerEdit(input: $input) { employeeId fullName ok errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PeopleOrg {\n    orgChart {\n      id fullName jobTitle departmentId department locationId location legalEntityId legalEntity place timezone\n      workEmail workPhone workPhoneExt photoUrl managerId managerName directReportCount outUntil employeeNumber hireDate mobile linkedinUrl twitter facebook\n    }\n  }\n"): (typeof documents)["\n  query PeopleOrg {\n    orgChart {\n      id fullName jobTitle departmentId department locationId location legalEntityId legalEntity place timezone\n      workEmail workPhone workPhoneExt photoUrl managerId managerName directReportCount outUntil employeeNumber hireDate mobile linkedinUrl twitter facebook\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveReviewCycle($input: ReviewCycleInput!) { saveReviewCycle(input: $input) { cycle { id } errors { field message } } }\n"): (typeof documents)["\n  mutation SaveReviewCycle($input: ReviewCycleInput!) { saveReviewCycle(input: $input) { cycle { id } errors { field message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PerformancePeopleSearch($search: String) { directory(search: $search, first: 8) { nodes { id fullName jobTitle } } }\n"): (typeof documents)["\n  query PerformancePeopleSearch($search: String) { directory(search: $search, first: 8) { nodes { id fullName jobTitle } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment GoalFields on Goal {\n    id title description employeeId employeeName parentId parentTitle startDate dueDate progress status supporting canEdit updatedAt\n    keyResults { id title startValue targetValue currentValue unit progress }\n  }\n"): (typeof documents)["\n  fragment GoalFields on Goal {\n    id title description employeeId employeeName parentId parentTitle startDate dueDate progress status supporting canEdit updatedAt\n    keyResults { id title startValue targetValue currentValue unit progress }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ReviewRowFields on ReviewSummary {\n    id cycleName cycleStatus employeeName department managerName status overallRating calibratedRating scale myRole myResponseId myResponseDone due\n    selfDone managerDone\n  }\n"): (typeof documents)["\n  fragment ReviewRowFields on ReviewSummary {\n    id cycleName cycleStatus employeeName department managerName status overallRating calibratedRating scale myRole myResponseId myResponseDone due\n    selfDone managerDone\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeBenefits($employeeId: ID!) {\n    employeeBenefits(employeeId: $employeeId) {\n      id status startDate endDate memberNumber coverage dependants note\n      plan { id name kind provider employeeRate employerRate basis statutory }\n    }\n    benefitPlans { id name kind provider employeeRate employerRate basis statutory isActive }\n  }\n"): (typeof documents)["\n  query EmployeeBenefits($employeeId: ID!) {\n    employeeBenefits(employeeId: $employeeId) {\n      id status startDate endDate memberNumber coverage dependants note\n      plan { id name kind provider employeeRate employerRate basis statutory }\n    }\n    benefitPlans { id name kind provider employeeRate employerRate basis statutory isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveBenefitEnrollment($input: SaveEnrollmentInput!) {\n    saveBenefitEnrollment(input: $input) { enrollment { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveBenefitEnrollment($input: SaveEnrollmentInput!) {\n    saveBenefitEnrollment(input: $input) { enrollment { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteBenefitEnrollment($id: ID!) {\n    deleteBenefitEnrollment(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteBenefitEnrollment($id: ID!) {\n    deleteBenefitEnrollment(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetBonusTarget($input: BonusTargetInput!) {\n    setBonusTarget(input: $input) { employee { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SetBonusTarget($input: BonusTargetInput!) {\n    setBonusTarget(input: $input) { employee { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddEmployeeNote($employeeId: ID!, $body: String!, $remindOn: Date) {\n    addEmployeeNote(employeeId: $employeeId, body: $body, remindOn: $remindOn) { note { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation AddEmployeeNote($employeeId: ID!, $body: String!, $remindOn: Date) {\n    addEmployeeNote(employeeId: $employeeId, body: $body, remindOn: $remindOn) { note { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteEmployeeNote($id: ID!) {\n    deleteEmployeeNote(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmployeeNote($id: ID!) {\n    deleteEmployeeNote(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeChecklist($employeeId: ID!, $kind: ChecklistKind!) {\n    checklist(employeeId: $employeeId, kind: $kind) {\n      startDate\n      tasks { id title description category assignee dueDate completedAt completedByName canComplete }\n    }\n  }\n"): (typeof documents)["\n  query EmployeeChecklist($employeeId: ID!, $kind: ChecklistKind!) {\n    checklist(employeeId: $employeeId, kind: $kind) {\n      startDate\n      tasks { id title description category assignee dueDate completedAt completedByName canComplete }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartChecklist($employeeId: ID!, $kind: ChecklistKind!, $startDate: Date) {\n    startChecklist(employeeId: $employeeId, kind: $kind, startDate: $startDate) { tasks { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation StartChecklist($employeeId: ID!, $kind: ChecklistKind!, $startDate: Date) {\n    startChecklist(employeeId: $employeeId, kind: $kind, startDate: $startDate) { tasks { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetTaskDone($id: ID!, $done: Boolean!) {\n    setTaskDone(id: $id, done: $done) { task { id completedAt } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SetTaskDone($id: ID!, $done: Boolean!) {\n    setTaskDone(id: $id, done: $done) { task { id completedAt } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddEmployeeTask($input: AddTaskInput!) {\n    addEmployeeTask(input: $input) { task { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation AddEmployeeTask($input: AddTaskInput!) {\n    addEmployeeTask(input: $input) { task { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteEmployeeTask($id: ID!) {\n    deleteEmployeeTask(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteEmployeeTask($id: ID!) {\n    deleteEmployeeTask(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveLayoutCustomField($input: SaveCustomFieldInput!) {\n    saveCustomField(input: $input) { field { id key name } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveLayoutCustomField($input: SaveCustomFieldInput!) {\n    saveCustomField(input: $input) { field { id key name } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveLayoutCustomTable($input: SaveCustomTableInput!) {\n    saveCustomTable(input: $input) { table { id key name } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveLayoutCustomTable($input: SaveCustomTableInput!) {\n    saveCustomTable(input: $input) { table { id key name } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateEmployeeFields($input: UpdateEmployeeInput!) {\n    updateEmployee(input: $input) { employee { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation UpdateEmployeeFields($input: UpdateEmployeeInput!) {\n    updateEmployee(input: $input) { employee { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateMyFields($input: MyDetailsInput!) {\n    updateMyDetails(input: $input) { applied request { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation UpdateMyFields($input: MyDetailsInput!) {\n    updateMyDetails(input: $input) { applied request { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetCustomFields($employeeId: ID!, $values: JSON!) {\n    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SetCustomFields($employeeId: ID!, $values: JSON!) {\n    setEmployeeCustomValues(employeeId: $employeeId, values: $values) { ok errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query LeaveHistory($employeeId: ID, $leaveTypeId: ID!, $year: Int) {\n    leaveHistory(employeeId: $employeeId, leaveTypeId: $leaveTypeId, year: $year) {\n      years\n      rows { id date kind description detail used earned balance }\n    }\n  }\n"): (typeof documents)["\n  query LeaveHistory($employeeId: ID, $leaveTypeId: ID!, $year: Int) {\n    leaveHistory(employeeId: $employeeId, leaveTypeId: $leaveTypeId, year: $year) {\n      years\n      rows { id date kind description detail used earned balance }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveTableRow($input: TableRowInput!) {\n    saveTableRow(input: $input) { row { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveTableRow($input: TableRowInput!) {\n    saveTableRow(input: $input) { row { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTableRow($id: ID!) {\n    deleteTableRow(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteTableRow($id: ID!) {\n    deleteTableRow(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TrainingStatus($id: ID!) {\n    trainingStatus(employeeId: $id) { courseId course lastCompleted dueOn state }\n  }\n"): (typeof documents)["\n  query TrainingStatus($id: ID!) {\n    trainingStatus(employeeId: $id) { courseId course lastCompleted dueOn state }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeProfile($id: ID!) {\n    employee(id: $id) {\n      id\n      completeness { percent missing { key label tab critical why } }\n      employeeNumber\n      fieldAccess\n      fullName\n      firstName\n      middleName\n      lastName\n      preferredName\n      workEmail\n      personalEmail\n      phone\n      workPhone\n      workPhoneExt\n      dateOfBirth\n      gender\n      maritalStatus\n      personal { nationality pronouns linkedinUrl twitter facebook homePhone addressLine1 addressLine2 city state postalCode country }\n      photoUrl\n      status\n      hireDate\n      probationEndDate\n      terminationDate\n      terminationReason\n      employmentType\n      archivedAt\n      legalEntity { id name }\n      department { id name }\n      location { id name city country timezone }\n      jobTitle { id name description }\n      grade { id name }\n      manager { id fullName jobTitle { name } photoUrl }\n      directReports { id fullName jobTitle { name } }\n      emergencyContacts {\n        id name relationship phone workPhone workPhoneExt homePhone email isPrimary\n        addressLine1 addressLine2 city state postalCode country\n      }\n      privateDetails { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }\n      customValues { value field { id key name fieldType choices helpText hrOnly } }\n      tableRows { id tableKey values createdAt }\n      compensation { amount currency frequency effectiveDate payType paySchedule overtime }\n      compensationHistory { id amount currency frequency effectiveDate reason payType paySchedule overtime comment }\n      bonusTarget { percent amount }\n      statusHistory { id effectiveDate status comment }\n      notes { id body authorName createdAt }\n      employmentHistory {\n        id effectiveDate changeType reason\n        jobTitle { name }\n        department { name }\n        location { name }\n        grade { name }\n        manager { fullName }\n        employmentType\n      }\n    }\n  }\n"): (typeof documents)["\n  query EmployeeProfile($id: ID!) {\n    employee(id: $id) {\n      id\n      completeness { percent missing { key label tab critical why } }\n      employeeNumber\n      fieldAccess\n      fullName\n      firstName\n      middleName\n      lastName\n      preferredName\n      workEmail\n      personalEmail\n      phone\n      workPhone\n      workPhoneExt\n      dateOfBirth\n      gender\n      maritalStatus\n      personal { nationality pronouns linkedinUrl twitter facebook homePhone addressLine1 addressLine2 city state postalCode country }\n      photoUrl\n      status\n      hireDate\n      probationEndDate\n      terminationDate\n      terminationReason\n      employmentType\n      archivedAt\n      legalEntity { id name }\n      department { id name }\n      location { id name city country timezone }\n      jobTitle { id name description }\n      grade { id name }\n      manager { id fullName jobTitle { name } photoUrl }\n      directReports { id fullName jobTitle { name } }\n      emergencyContacts {\n        id name relationship phone workPhone workPhoneExt homePhone email isPrimary\n        addressLine1 addressLine2 city state postalCode country\n      }\n      privateDetails { bankName bankAccountName bankAccountNumber nationalId taxId pensionId masked }\n      customValues { value field { id key name fieldType choices helpText hrOnly } }\n      tableRows { id tableKey values createdAt }\n      compensation { amount currency frequency effectiveDate payType paySchedule overtime }\n      compensationHistory { id amount currency frequency effectiveDate reason payType paySchedule overtime comment }\n      bonusTarget { percent amount }\n      statusHistory { id effectiveDate status comment }\n      notes { id body authorName createdAt }\n      employmentHistory {\n        id effectiveDate changeType reason\n        jobTitle { name }\n        department { name }\n        location { name }\n        grade { name }\n        manager { fullName }\n        employmentType\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProfileLayout {\n    profileLayout {\n      tabs {\n        key name builtin\n        sections { key title icon items { id kind key label fields } }\n      }\n      library { id kind key label fields }\n    }\n    customTables(includeInactive: true) { id key name hrOnly pay standard isActive columns { key name type choices } }\n    customFields(includeInactive: true) { id key }\n  }\n"): (typeof documents)["\n  query ProfileLayout {\n    profileLayout {\n      tabs {\n        key name builtin\n        sections { key title icon items { id kind key label fields } }\n      }\n      library { id kind key label fields }\n    }\n    customTables(includeInactive: true) { id key name hrOnly pay standard isActive columns { key name type choices } }\n    customFields(includeInactive: true) { id key }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveProfileLayout($config: JSON!) {\n    saveProfileLayout(config: $config) { layout { tabs { key } } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveProfileLayout($config: JSON!) {\n    saveProfileLayout(config: $config) { layout { tabs { key } } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CustomReportOptions {\n    customReportFields { key label category }\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n  }\n"): (typeof documents)["\n  query CustomReportOptions {\n    customReportFields { key label category }\n    departments { id name isActive }\n    locations { id name isActive }\n    legalEntities { id name isActive }\n    jobTitles { id name isActive }\n    grades { id name isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CustomReportPreview($fields: [String!], $filter: JSON, $showing: String!) {\n    runCustomReport(fields: $fields, filter: $filter, showing: $showing) { chart note rows columns { key label kind } summary { label value } }\n  }\n"): (typeof documents)["\n  query CustomReportPreview($fields: [String!], $filter: JSON, $showing: String!) {\n    runCustomReport(fields: $fields, filter: $filter, showing: $showing) { chart note rows columns { key label kind } summary { label value } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveCustomReport($input: CustomReportInput!) {\n    saveCustomReport(input: $input) { report { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveCustomReport($input: CustomReportInput!) {\n    saveCustomReport(input: $input) { report { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AccessLevels {\n    roles { id code name description permissions scope isSystem fieldAccess memberCount }\n    permissionCatalog { code description }\n    fieldGroups { key description }\n    members { id fullName email isActive invitePending lastLogin roles { code } }\n    me { user { email } }\n  }\n"): (typeof documents)["\n  query AccessLevels {\n    roles { id code name description permissions scope isSystem fieldAccess memberCount }\n    permissionCatalog { code description }\n    fieldGroups { key description }\n    members { id fullName email isActive invitePending lastLogin roles { code } }\n    me { user { email } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveRole($input: SaveRoleInput!) {\n    saveRole(input: $input) { role { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveRole($input: SaveRoleInput!) {\n    saveRole(input: $input) { role { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DuplicateRole($id: ID!, $name: String!) {\n    duplicateRole(id: $id, name: $name) { role { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation DuplicateRole($id: ID!, $name: String!) {\n    duplicateRole(id: $id, name: $name) { role { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteRole($id: ID!) {\n    deleteRole(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteRole($id: ID!) {\n    deleteRole(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AccountData {\n    dataExports { id status size summary error requestedBy createdAt finishedAt expiresAt }\n    accountClosure { status closesOn requestedAt requestedBy reason graceDays backupDays }\n  }\n"): (typeof documents)["\n  query AccountData {\n    dataExports { id status size summary error requestedBy createdAt finishedAt expiresAt }\n    accountClosure { status closesOn requestedAt requestedBy reason graceDays backupDays }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RequestDataExport { requestDataExport { id status } }"): (typeof documents)["mutation RequestDataExport { requestDataExport { id status } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DataExportUrl($id: ID!) { dataExportUrl(id: $id) }"): (typeof documents)["mutation DataExportUrl($id: ID!) { dataExportUrl(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestAccountClosure($companyName: String!, $password: String!, $reason: String) {\n    requestAccountClosure(companyName: $companyName, password: $password, reason: $reason) { closure { status closesOn } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation RequestAccountClosure($companyName: String!, $password: String!, $reason: String) {\n    requestAccountClosure(companyName: $companyName, password: $password, reason: $reason) { closure { status closesOn } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CancelAccountClosure { cancelAccountClosure { closure { status } errors { message } } }"): (typeof documents)["mutation CancelAccountClosure { cancelAccountClosure { closure { status } errors { message } } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MyCalendarFeeds { myCalendarFeeds { id kinds url lastUsedAt } }\n"): (typeof documents)["\n  query MyCalendarFeeds { myCalendarFeeds { id kinds url lastUsedAt } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCalendarFeed($kinds: [String!]!) { createCalendarFeed(kinds: $kinds) { id } }\n"): (typeof documents)["\n  mutation CreateCalendarFeed($kinds: [String!]!) { createCalendarFeed(kinds: $kinds) { id } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeleteCalendarFeed($id: ID!) { deleteCalendarFeed(id: $id) }"): (typeof documents)["mutation DeleteCalendarFeed($id: ID!) { deleteCalendarFeed(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ApiKeys { apiKeys { id name prefix readOnly owner createdAt lastUsedAt } }\n"): (typeof documents)["\n  query ApiKeys { apiKeys { id name prefix readOnly owner createdAt lastUsedAt } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateApiKey($name: String!, $readOnly: Boolean!) { createApiKey(name: $name, readOnly: $readOnly) { secret } }\n"): (typeof documents)["\n  mutation CreateApiKey($name: String!, $readOnly: Boolean!) { createApiKey(name: $name, readOnly: $readOnly) { secret } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RevokeApiKey($id: ID!) { revokeApiKey(id: $id) }"): (typeof documents)["mutation RevokeApiKey($id: ID!) { revokeApiKey(id: $id) }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyEmailPreferences { myEmailPreferences { key label email } }"): (typeof documents)["query MyEmailPreferences { myEmailPreferences { key label email } }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetEmailPreferences($off: [String!]!) { setEmailPreferences(emailOff: $off) { key email } }\n"): (typeof documents)["\n  mutation SetEmailPreferences($off: [String!]!) { setEmailPreferences(emailOff: $off) { key email } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query InviteCandidates { inviteCandidates { withoutEmail people { employeeId name email department } } }\n"): (typeof documents)["\n  query InviteCandidates { inviteCandidates { withoutEmail people { employeeId name email department } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InviteEmployees($ids: [ID!]!) { inviteEmployees(employeeIds: $ids) { invited problems { name message } } }\n"): (typeof documents)["\n  mutation InviteEmployees($ids: [ID!]!) { inviteEmployees(employeeIds: $ids) { invited problems { name message } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query OptionListsAdmin {\n    optionLists { key name }\n    listOptions(includeInactive: true) { id listKey label position isActive }\n  }\n"): (typeof documents)["\n  query OptionListsAdmin {\n    optionLists { key name }\n    listOptions(includeInactive: true) { id listKey label position isActive }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveListOption($input: ListOptionInput!) {\n    saveListOption(input: $input) { option { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveListOption($input: ListOptionInput!) {\n    saveListOption(input: $input) { option { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ReorderListOptions($ids: [ID!]!) { reorderListOptions(ids: $ids) }\n"): (typeof documents)["\n  mutation ReorderListOptions($ids: [ID!]!) { reorderListOptions(ids: $ids) }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteListOption($id: ID!) { deleteListOption(id: $id) }\n"): (typeof documents)["\n  mutation DeleteListOption($id: ID!) { deleteListOption(id: $id) }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ListChoices($key: ListKey!) {\n    listOptions(listKey: $key) { id label }\n  }\n"): (typeof documents)["\n  query ListChoices($key: ListKey!) {\n    listOptions(listKey: $key) { id label }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SetupProgress { setupProgress { percent steps { key label why href done group } } }\n"): (typeof documents)["\n  query SetupProgress { setupProgress { percent steps { key label why href done group } } }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamsAdmin {\n    teams(includeInactive: true) { id name description isActive leadId leadName memberIds memberNames }\n    orgChart { id fullName jobTitle }\n  }\n"): (typeof documents)["\n  query TeamsAdmin {\n    teams(includeInactive: true) { id name description isActive leadId leadName memberIds memberNames }\n    orgChart { id fullName jobTitle }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SaveTeam($input: TeamInput!) {\n    saveTeam(input: $input) { team { id } errors { field message } }\n  }\n"): (typeof documents)["\n  mutation SaveTeam($input: TeamInput!) {\n    saveTeam(input: $input) { team { id } errors { field message } }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTeam($id: ID!) { deleteTeam(id: $id) }\n"): (typeof documents)["\n  mutation DeleteTeam($id: ID!) { deleteTeam(id: $id) }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation StartViewAs($id: ID!) {\n    startViewAs(memberId: $id) { permissions }\n  }\n"): (typeof documents)["\n  mutation StartViewAs($id: ID!) {\n    startViewAs(memberId: $id) { permissions }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EmployeeSnapshot($id: ID!) {\n    employee(id: $id) {\n      id fullName photoUrl employeeNumber workEmail phone workPhone workPhoneExt dateOfBirth\n      hireDate status employmentType\n      jobTitle { name } department { name } grade { name } legalEntity { name }\n      location { name city country }\n      manager { id fullName }\n      directReports { id }\n      employmentHistory { id effectiveDate changeType jobTitle { name } }\n      compensationHistory { id effectiveDate amount currency frequency }\n    }\n  }\n"): (typeof documents)["\n  query EmployeeSnapshot($id: ID!) {\n    employee(id: $id) {\n      id fullName photoUrl employeeNumber workEmail phone workPhone workPhoneExt dateOfBirth\n      hireDate status employmentType\n      jobTitle { name } department { name } grade { name } legalEntity { name }\n      location { name city country }\n      manager { id fullName }\n      directReports { id }\n      employmentHistory { id effectiveDate changeType jobTitle { name } }\n      compensationHistory { id effectiveDate amount currency frequency }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ReportCatalog {\n    reportCatalog { key title description usesRange groupings category favorite lastViewed }\n  }\n"): (typeof documents)["\n  query ReportCatalog {\n    reportCatalog { key title description usesRange groupings category favorite lastViewed }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CustomReports {\n    customReports { id name description fields filter showing shared ownerName mine favorite lastViewed }\n  }\n"): (typeof documents)["\n  query CustomReports {\n    customReports { id name description fields filter showing shared ownerName mine favorite lastViewed }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetFavoriteReport($favorite: Boolean!, $key: String, $customId: ID) {\n    setFavoriteReport(favorite: $favorite, key: $key, customId: $customId)\n  }\n"): (typeof documents)["\n  mutation SetFavoriteReport($favorite: Boolean!, $key: String, $customId: ID) {\n    setFavoriteReport(favorite: $favorite, key: $key, customId: $customId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      permissions\n      roles\n      user { id email fullName }\n      employee { id fullName jobTitle { name } }\n      hasPayslips\n      mfaEnabled mfaSetupRequired recoveryCodesLeft\n      viewingAs { name realName startedAt }\n    }\n    tenant {\n      name slug primaryColor country currency logoUrl\n      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads attendanceEnabled expensesEnabled timesheetsEnabled payrollEnabled status closesOn\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      permissions\n      roles\n      user { id email fullName }\n      employee { id fullName jobTitle { name } }\n      hasPayslips\n      mfaEnabled mfaSetupRequired recoveryCodesLeft\n      viewingAs { name realName startedAt }\n    }\n    tenant {\n      name slug primaryColor country currency logoUrl\n      dateFormat nameFormat showCurrencyCode employeesEditOwnPhoto expandedGender employeeUploads attendanceEnabled expensesEnabled timesheetsEnabled payrollEnabled status closesOn\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;