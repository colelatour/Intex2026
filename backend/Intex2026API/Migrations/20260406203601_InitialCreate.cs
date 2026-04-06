using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Intex2026API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "donation_allocations",
                columns: table => new
                {
                    allocation_id = table.Column<string>(type: "TEXT", nullable: false),
                    donation_id = table.Column<string>(type: "TEXT", nullable: true),
                    safehouse_id = table.Column<string>(type: "TEXT", nullable: true),
                    program_area = table.Column<string>(type: "TEXT", nullable: true),
                    amount_allocated = table.Column<decimal>(type: "TEXT", nullable: true),
                    allocation_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    allocation_notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_donation_allocations", x => x.allocation_id);
                });

            migrationBuilder.CreateTable(
                name: "donations",
                columns: table => new
                {
                    donation_id = table.Column<string>(type: "TEXT", nullable: false),
                    supporter_id = table.Column<string>(type: "TEXT", nullable: true),
                    donation_type = table.Column<string>(type: "TEXT", nullable: true),
                    donation_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    is_recurring = table.Column<string>(type: "TEXT", nullable: true),
                    campaign_name = table.Column<string>(type: "TEXT", nullable: true),
                    channel_source = table.Column<string>(type: "TEXT", nullable: true),
                    currency_code = table.Column<string>(type: "TEXT", nullable: true),
                    amount = table.Column<decimal>(type: "TEXT", nullable: true),
                    estimated_value = table.Column<decimal>(type: "TEXT", nullable: true),
                    impact_unit = table.Column<string>(type: "TEXT", nullable: true),
                    notes = table.Column<string>(type: "TEXT", nullable: true),
                    referral_post_id = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_donations", x => x.donation_id);
                });

            migrationBuilder.CreateTable(
                name: "education_records",
                columns: table => new
                {
                    education_record_id = table.Column<string>(type: "TEXT", nullable: false),
                    resident_id = table.Column<string>(type: "TEXT", nullable: true),
                    record_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    education_level = table.Column<string>(type: "TEXT", nullable: true),
                    school_name = table.Column<string>(type: "TEXT", nullable: true),
                    enrollment_status = table.Column<string>(type: "TEXT", nullable: true),
                    attendance_rate = table.Column<decimal>(type: "TEXT", nullable: true),
                    progress_percent = table.Column<decimal>(type: "TEXT", nullable: true),
                    completion_status = table.Column<string>(type: "TEXT", nullable: true),
                    notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_education_records", x => x.education_record_id);
                });

            migrationBuilder.CreateTable(
                name: "health_wellbeing_records",
                columns: table => new
                {
                    health_record_id = table.Column<string>(type: "TEXT", nullable: false),
                    resident_id = table.Column<string>(type: "TEXT", nullable: true),
                    record_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    general_health_score = table.Column<decimal>(type: "TEXT", nullable: true),
                    nutrition_score = table.Column<decimal>(type: "TEXT", nullable: true),
                    sleep_quality_score = table.Column<decimal>(type: "TEXT", nullable: true),
                    energy_level_score = table.Column<decimal>(type: "TEXT", nullable: true),
                    height_cm = table.Column<decimal>(type: "TEXT", nullable: true),
                    weight_kg = table.Column<decimal>(type: "TEXT", nullable: true),
                    bmi = table.Column<decimal>(type: "TEXT", nullable: true),
                    medical_checkup_done = table.Column<string>(type: "TEXT", nullable: true),
                    dental_checkup_done = table.Column<string>(type: "TEXT", nullable: true),
                    psychological_checkup_done = table.Column<string>(type: "TEXT", nullable: true),
                    notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_health_wellbeing_records", x => x.health_record_id);
                });

            migrationBuilder.CreateTable(
                name: "home_visitations",
                columns: table => new
                {
                    visitation_id = table.Column<string>(type: "TEXT", nullable: false),
                    resident_id = table.Column<string>(type: "TEXT", nullable: true),
                    visit_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    social_worker = table.Column<string>(type: "TEXT", nullable: true),
                    visit_type = table.Column<string>(type: "TEXT", nullable: true),
                    location_visited = table.Column<string>(type: "TEXT", nullable: true),
                    family_members_present = table.Column<string>(type: "TEXT", nullable: true),
                    purpose = table.Column<string>(type: "TEXT", nullable: true),
                    observations = table.Column<string>(type: "TEXT", nullable: true),
                    family_cooperation_level = table.Column<string>(type: "TEXT", nullable: true),
                    safety_concerns_noted = table.Column<string>(type: "TEXT", nullable: true),
                    follow_up_needed = table.Column<string>(type: "TEXT", nullable: true),
                    follow_up_notes = table.Column<string>(type: "TEXT", nullable: true),
                    visit_outcome = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_home_visitations", x => x.visitation_id);
                });

            migrationBuilder.CreateTable(
                name: "in_kind_donation_items",
                columns: table => new
                {
                    item_id = table.Column<string>(type: "TEXT", nullable: false),
                    donation_id = table.Column<string>(type: "TEXT", nullable: true),
                    item_name = table.Column<string>(type: "TEXT", nullable: true),
                    item_category = table.Column<string>(type: "TEXT", nullable: true),
                    quantity = table.Column<string>(type: "TEXT", nullable: true),
                    unit_of_measure = table.Column<string>(type: "TEXT", nullable: true),
                    estimated_unit_value = table.Column<decimal>(type: "TEXT", nullable: true),
                    intended_use = table.Column<string>(type: "TEXT", nullable: true),
                    received_condition = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_in_kind_donation_items", x => x.item_id);
                });

            migrationBuilder.CreateTable(
                name: "incident_reports",
                columns: table => new
                {
                    incident_id = table.Column<string>(type: "TEXT", nullable: false),
                    resident_id = table.Column<string>(type: "TEXT", nullable: true),
                    safehouse_id = table.Column<string>(type: "TEXT", nullable: true),
                    incident_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    incident_type = table.Column<string>(type: "TEXT", nullable: true),
                    severity = table.Column<string>(type: "TEXT", nullable: true),
                    description = table.Column<string>(type: "TEXT", nullable: true),
                    response_taken = table.Column<string>(type: "TEXT", nullable: true),
                    resolved = table.Column<string>(type: "TEXT", nullable: true),
                    resolution_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    reported_by = table.Column<string>(type: "TEXT", nullable: true),
                    follow_up_required = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_incident_reports", x => x.incident_id);
                });

            migrationBuilder.CreateTable(
                name: "intervention_plans",
                columns: table => new
                {
                    plan_id = table.Column<string>(type: "TEXT", nullable: false),
                    resident_id = table.Column<string>(type: "TEXT", nullable: true),
                    plan_category = table.Column<string>(type: "TEXT", nullable: true),
                    plan_description = table.Column<string>(type: "TEXT", nullable: true),
                    services_provided = table.Column<string>(type: "TEXT", nullable: true),
                    target_value = table.Column<decimal>(type: "TEXT", nullable: true),
                    target_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    status = table.Column<string>(type: "TEXT", nullable: true),
                    case_conference_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intervention_plans", x => x.plan_id);
                });

            migrationBuilder.CreateTable(
                name: "partner_assignments",
                columns: table => new
                {
                    assignment_id = table.Column<string>(type: "TEXT", nullable: false),
                    partner_id = table.Column<string>(type: "TEXT", nullable: true),
                    safehouse_id = table.Column<decimal>(type: "TEXT", nullable: true),
                    program_area = table.Column<string>(type: "TEXT", nullable: true),
                    assignment_start = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    assignment_end = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    responsibility_notes = table.Column<string>(type: "TEXT", nullable: true),
                    is_primary = table.Column<string>(type: "TEXT", nullable: true),
                    status = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_partner_assignments", x => x.assignment_id);
                });

            migrationBuilder.CreateTable(
                name: "partners",
                columns: table => new
                {
                    partner_id = table.Column<string>(type: "TEXT", nullable: false),
                    partner_name = table.Column<string>(type: "TEXT", nullable: true),
                    partner_type = table.Column<string>(type: "TEXT", nullable: true),
                    role_type = table.Column<string>(type: "TEXT", nullable: true),
                    contact_name = table.Column<string>(type: "TEXT", nullable: true),
                    email = table.Column<string>(type: "TEXT", nullable: true),
                    phone = table.Column<string>(type: "TEXT", nullable: true),
                    region = table.Column<string>(type: "TEXT", nullable: true),
                    status = table.Column<string>(type: "TEXT", nullable: true),
                    start_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    end_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_partners", x => x.partner_id);
                });

            migrationBuilder.CreateTable(
                name: "process_recordings",
                columns: table => new
                {
                    recording_id = table.Column<string>(type: "TEXT", nullable: false),
                    resident_id = table.Column<string>(type: "TEXT", nullable: true),
                    session_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    social_worker = table.Column<string>(type: "TEXT", nullable: true),
                    session_type = table.Column<string>(type: "TEXT", nullable: true),
                    session_duration_minutes = table.Column<string>(type: "TEXT", nullable: true),
                    emotional_state_observed = table.Column<string>(type: "TEXT", nullable: true),
                    emotional_state_end = table.Column<string>(type: "TEXT", nullable: true),
                    session_narrative = table.Column<string>(type: "TEXT", nullable: true),
                    interventions_applied = table.Column<string>(type: "TEXT", nullable: true),
                    follow_up_actions = table.Column<string>(type: "TEXT", nullable: true),
                    progress_noted = table.Column<string>(type: "TEXT", nullable: true),
                    concerns_flagged = table.Column<string>(type: "TEXT", nullable: true),
                    referral_made = table.Column<string>(type: "TEXT", nullable: true),
                    notes_restricted = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_process_recordings", x => x.recording_id);
                });

            migrationBuilder.CreateTable(
                name: "public_impact_snapshots",
                columns: table => new
                {
                    snapshot_id = table.Column<string>(type: "TEXT", nullable: false),
                    snapshot_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    headline = table.Column<string>(type: "TEXT", nullable: true),
                    summary_text = table.Column<string>(type: "TEXT", nullable: true),
                    metric_payload_json = table.Column<string>(type: "TEXT", nullable: true),
                    is_published = table.Column<string>(type: "TEXT", nullable: true),
                    published_at = table.Column<DateOnly>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_public_impact_snapshots", x => x.snapshot_id);
                });

            migrationBuilder.CreateTable(
                name: "residents",
                columns: table => new
                {
                    resident_id = table.Column<string>(type: "TEXT", nullable: false),
                    case_control_no = table.Column<string>(type: "TEXT", nullable: true),
                    internal_code = table.Column<string>(type: "TEXT", nullable: true),
                    safehouse_id = table.Column<string>(type: "TEXT", nullable: true),
                    case_status = table.Column<string>(type: "TEXT", nullable: true),
                    sex = table.Column<string>(type: "TEXT", nullable: true),
                    date_of_birth = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    birth_status = table.Column<string>(type: "TEXT", nullable: true),
                    place_of_birth = table.Column<string>(type: "TEXT", nullable: true),
                    religion = table.Column<string>(type: "TEXT", nullable: true),
                    case_category = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_orphaned = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_trafficked = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_child_labor = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_physical_abuse = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_sexual_abuse = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_osaec = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_cicl = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_at_risk = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_street_child = table.Column<string>(type: "TEXT", nullable: true),
                    sub_cat_child_with_hiv = table.Column<string>(type: "TEXT", nullable: true),
                    is_pwd = table.Column<string>(type: "TEXT", nullable: true),
                    pwd_type = table.Column<string>(type: "TEXT", nullable: true),
                    has_special_needs = table.Column<string>(type: "TEXT", nullable: true),
                    special_needs_diagnosis = table.Column<string>(type: "TEXT", nullable: true),
                    family_is_4ps = table.Column<string>(type: "TEXT", nullable: true),
                    family_solo_parent = table.Column<string>(type: "TEXT", nullable: true),
                    family_indigenous = table.Column<string>(type: "TEXT", nullable: true),
                    family_parent_pwd = table.Column<string>(type: "TEXT", nullable: true),
                    family_informal_settler = table.Column<string>(type: "TEXT", nullable: true),
                    date_of_admission = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    age_upon_admission = table.Column<string>(type: "TEXT", nullable: true),
                    present_age = table.Column<string>(type: "TEXT", nullable: true),
                    length_of_stay = table.Column<string>(type: "TEXT", nullable: true),
                    referral_source = table.Column<string>(type: "TEXT", nullable: true),
                    referring_agency_person = table.Column<string>(type: "TEXT", nullable: true),
                    date_colb_registered = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    date_colb_obtained = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    assigned_social_worker = table.Column<string>(type: "TEXT", nullable: true),
                    initial_case_assessment = table.Column<string>(type: "TEXT", nullable: true),
                    date_case_study_prepared = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    reintegration_type = table.Column<string>(type: "TEXT", nullable: true),
                    reintegration_status = table.Column<string>(type: "TEXT", nullable: true),
                    initial_risk_level = table.Column<string>(type: "TEXT", nullable: true),
                    current_risk_level = table.Column<string>(type: "TEXT", nullable: true),
                    date_enrolled = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    date_closed = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    notes_restricted = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_residents", x => x.resident_id);
                });

            migrationBuilder.CreateTable(
                name: "safehouse_monthly_metrics",
                columns: table => new
                {
                    metric_id = table.Column<string>(type: "TEXT", nullable: false),
                    safehouse_id = table.Column<string>(type: "TEXT", nullable: true),
                    month_start = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    month_end = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    active_residents = table.Column<string>(type: "TEXT", nullable: true),
                    avg_education_progress = table.Column<decimal>(type: "TEXT", nullable: true),
                    avg_health_score = table.Column<decimal>(type: "TEXT", nullable: true),
                    process_recording_count = table.Column<string>(type: "TEXT", nullable: true),
                    home_visitation_count = table.Column<string>(type: "TEXT", nullable: true),
                    incident_count = table.Column<string>(type: "TEXT", nullable: true),
                    notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_safehouse_monthly_metrics", x => x.metric_id);
                });

            migrationBuilder.CreateTable(
                name: "safehouses",
                columns: table => new
                {
                    safehouse_id = table.Column<string>(type: "TEXT", nullable: false),
                    safehouse_code = table.Column<string>(type: "TEXT", nullable: true),
                    name = table.Column<string>(type: "TEXT", nullable: true),
                    region = table.Column<string>(type: "TEXT", nullable: true),
                    city = table.Column<string>(type: "TEXT", nullable: true),
                    province = table.Column<string>(type: "TEXT", nullable: true),
                    country = table.Column<string>(type: "TEXT", nullable: true),
                    open_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    status = table.Column<string>(type: "TEXT", nullable: true),
                    capacity_girls = table.Column<string>(type: "TEXT", nullable: true),
                    capacity_staff = table.Column<string>(type: "TEXT", nullable: true),
                    current_occupancy = table.Column<string>(type: "TEXT", nullable: true),
                    notes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_safehouses", x => x.safehouse_id);
                });

            migrationBuilder.CreateTable(
                name: "social_media_posts",
                columns: table => new
                {
                    post_id = table.Column<string>(type: "TEXT", nullable: false),
                    platform = table.Column<string>(type: "TEXT", nullable: true),
                    platform_post_id = table.Column<string>(type: "TEXT", nullable: true),
                    post_url = table.Column<string>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    day_of_week = table.Column<string>(type: "TEXT", nullable: true),
                    post_hour = table.Column<string>(type: "TEXT", nullable: true),
                    post_type = table.Column<string>(type: "TEXT", nullable: true),
                    media_type = table.Column<string>(type: "TEXT", nullable: true),
                    caption = table.Column<string>(type: "TEXT", nullable: true),
                    hashtags = table.Column<string>(type: "TEXT", nullable: true),
                    num_hashtags = table.Column<string>(type: "TEXT", nullable: true),
                    mentions_count = table.Column<string>(type: "TEXT", nullable: true),
                    has_call_to_action = table.Column<string>(type: "TEXT", nullable: true),
                    call_to_action_type = table.Column<string>(type: "TEXT", nullable: true),
                    content_topic = table.Column<string>(type: "TEXT", nullable: true),
                    sentiment_tone = table.Column<string>(type: "TEXT", nullable: true),
                    caption_length = table.Column<string>(type: "TEXT", nullable: true),
                    features_resident_story = table.Column<string>(type: "TEXT", nullable: true),
                    campaign_name = table.Column<string>(type: "TEXT", nullable: true),
                    is_boosted = table.Column<string>(type: "TEXT", nullable: true),
                    boost_budget_php = table.Column<decimal>(type: "TEXT", nullable: true),
                    impressions = table.Column<string>(type: "TEXT", nullable: true),
                    reach = table.Column<string>(type: "TEXT", nullable: true),
                    likes = table.Column<string>(type: "TEXT", nullable: true),
                    comments = table.Column<string>(type: "TEXT", nullable: true),
                    shares = table.Column<string>(type: "TEXT", nullable: true),
                    saves = table.Column<string>(type: "TEXT", nullable: true),
                    click_throughs = table.Column<string>(type: "TEXT", nullable: true),
                    video_views = table.Column<decimal>(type: "TEXT", nullable: true),
                    engagement_rate = table.Column<decimal>(type: "TEXT", nullable: true),
                    profile_visits = table.Column<string>(type: "TEXT", nullable: true),
                    donation_referrals = table.Column<string>(type: "TEXT", nullable: true),
                    estimated_donation_value_php = table.Column<decimal>(type: "TEXT", nullable: true),
                    follower_count_at_post = table.Column<string>(type: "TEXT", nullable: true),
                    watch_time_seconds = table.Column<decimal>(type: "TEXT", nullable: true),
                    avg_view_duration_seconds = table.Column<decimal>(type: "TEXT", nullable: true),
                    subscriber_count_at_post = table.Column<decimal>(type: "TEXT", nullable: true),
                    forwards = table.Column<decimal>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_social_media_posts", x => x.post_id);
                });

            migrationBuilder.CreateTable(
                name: "supporters",
                columns: table => new
                {
                    supporter_id = table.Column<string>(type: "TEXT", nullable: false),
                    supporter_type = table.Column<string>(type: "TEXT", nullable: true),
                    display_name = table.Column<string>(type: "TEXT", nullable: true),
                    organization_name = table.Column<string>(type: "TEXT", nullable: true),
                    first_name = table.Column<string>(type: "TEXT", nullable: true),
                    last_name = table.Column<string>(type: "TEXT", nullable: true),
                    relationship_type = table.Column<string>(type: "TEXT", nullable: true),
                    region = table.Column<string>(type: "TEXT", nullable: true),
                    country = table.Column<string>(type: "TEXT", nullable: true),
                    email = table.Column<string>(type: "TEXT", nullable: true),
                    phone = table.Column<string>(type: "TEXT", nullable: true),
                    status = table.Column<string>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                    first_donation_date = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    acquisition_channel = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_supporters", x => x.supporter_id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "donation_allocations");

            migrationBuilder.DropTable(
                name: "donations");

            migrationBuilder.DropTable(
                name: "education_records");

            migrationBuilder.DropTable(
                name: "health_wellbeing_records");

            migrationBuilder.DropTable(
                name: "home_visitations");

            migrationBuilder.DropTable(
                name: "in_kind_donation_items");

            migrationBuilder.DropTable(
                name: "incident_reports");

            migrationBuilder.DropTable(
                name: "intervention_plans");

            migrationBuilder.DropTable(
                name: "partner_assignments");

            migrationBuilder.DropTable(
                name: "partners");

            migrationBuilder.DropTable(
                name: "process_recordings");

            migrationBuilder.DropTable(
                name: "public_impact_snapshots");

            migrationBuilder.DropTable(
                name: "residents");

            migrationBuilder.DropTable(
                name: "safehouse_monthly_metrics");

            migrationBuilder.DropTable(
                name: "safehouses");

            migrationBuilder.DropTable(
                name: "social_media_posts");

            migrationBuilder.DropTable(
                name: "supporters");
        }
    }
}
