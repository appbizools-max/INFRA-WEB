INFRAOPS û TENANT ADMIN MODULE

FINAL APPROVED VERSION

This module is the Company Administration & Governance Layer for each InfraOps
customer.

It manages:

Organization Structure

Users & Security

Masters & Configurations

Approvals

Budgets

Notifications

Reports

Integrations

AI Settings

It does not manage operational workflows. Workflow ownership belongs to the Operations
Head inside the Operations Module.

MODULE OBJECTIVES

Enable each customer company to:

Configure company hierarchy

Manage users

Control permissions

Configure approvals

Maintain masters

Manage budgets

Configure reports

Manage integrations

Configure AI access

without requiring InfraOps development support.

SECTION 1 û ORGANIZATION SETUP

Purpose

Define company information.

Company Information

Company Name

Legal Name

Company Code

GST Number

PAN Number

CIN Number

Contact Information

Address

City

State

Country

Pincode

Communication

Phone

Email

Website

Branding

Company Logo

Letterhead Logo

Invoice Logo

Report Header/Footer

Functions

Used throughout:

Invoices

Reports

Mobile App

Customer Portal

Vendor Portal

SECTION 2 û BUSINESS UNIT MANAGEMENT

Purpose

Manage multiple divisions.

Examples

Mining Division

Logistics Division

Railway Operations Division

Port Operations Division

Fields

Business Unit Name

Business Unit Code

Parent Company

Business Unit Head

Functions

Business Unit-wise reporting and access control.

SECTION 3 û REGION MANAGEMENT

Purpose

Manage geographical regions.

Fields

Region Name

Region Code

Region Head

Examples

South Region

East Region

Odisha Region

Telangana Region

Functions

Regional reporting and hierarchy.

SECTION 4 û SITE MANAGEMENT

Purpose

Manage operational locations.

Site Types

Mine

Railway Siding

Stockyard

Port

Plant

Warehouse

Site Information

Site Name

Site Code

Site Type

Customer

Commodity

Location

State

District

Latitude

Longitude

Capacity

Storage Capacity

Daily Handling Capacity

Functions

Central master for:

Operations

Accounts

Fleet

HR

SECTION 5 û DEPARTMENT MANAGEMENT

Departments

Operations

Accounts

HR

Fleet

Safety

Maintenance

Procurement

Administration

Fields

Department Name

Department Code

Department Head

SECTION 6 û USER MANAGEMENT

Purpose

Manage all application users.

User Information

Employee ID

User ID

Name

Mobile Number

Email

Login Information

Username

Password Policy

MFA Enabled

Status

Active

Inactive

Locked

Assignment

Business Unit

Region

Site

Department

SECTION 7 û ROLE MANAGEMENT

Standard Roles

Tenant Admin

Full company administration

Operations Head

Operations governance

Accounts Manager

Finance governance

HR Manager

HR governance

Fleet Manager

Fleet governance

Site Manager

Site operations

Supervisor

Limited operational access

Customer User

Customer portal

Vendor User

Vendor portal

SECTION 8 û PERMISSION MANAGEMENT

Purpose

Control access rights.

Permission Types

View

Add

Edit

Delete

Approve

Export

Print

Permission Levels

Module Level

Screen Level

Field Level

Example

Accounts can:

   View Weighment

   Use Quantity for Billing

? Edit Weighment

SECTION 9 û MASTER DATA MANAGEMENT

Commodity Master

Examples:

Coal

Iron Ore

Limestone

Fly Ash

Sand

Grade Master

Coal Grades

Ore Grades

Quality Grades

Vehicle Type Master

Equipment Type Master

Labour Category Master

Expense Category Master

Customer Category Master

Vendor Category Master

Shift Master

Incident Category Master

Fuel Type Master

Unit of Measure Master

MT

Ton

CBM

KL

Hours

SECTION 10 û APPROVAL MATRIX MANAGEMENT

Purpose

Configure approvals.

Approval Types

Expenses

Advances

Vendor Bills

Labour Bills

Invoices

Contracts

Purchase Requests

Asset Purchases

Multi-Level Approval

Supervisor ? Site Manager ? Department Head ? Finance ? Management

SECTION 11 û OPERATIONAL RULES ENGINE

Purpose

Configure company-specific rules.

Examples

Operations

Dispatch not allowed without weighment.

Fleet

Deployment not allowed if insurance expired.

Accounts

Invoice not allowed if contract expired.

HR

Payroll not allowed if attendance incomplete.

SECTION 12 û CUSTOM KPI & SLA ENGINE

Purpose

Define business KPIs.

Operations KPIs

Truck TAT

Wagon Loading Time

Tons Per Hour

Fleet KPIs

Utilization %

Fuel Efficiency

HR KPIs

Attendance %

Productivity

Finance KPIs

Cost Per Ton

Profit Per Ton

Collection Efficiency

SLA Configuration

Customer SLA

Vendor SLA

Internal SLA

SECTION 13 û BUDGET MANAGEMENT

(Shared Access: Tenant Admin + Accounts + Operations Head)

Revenue Budget

Customer-wise

Contract-wise

Site-wise

Commodity-wise

Expense Budget

Labour

Equipment

Fuel

Repairs

Railway Charges

Site Expenses

Administration

Budget Workflow

Draft ? Review ? Approval ? Active

Controls

Budget Utilization

Budget Remaining

Budget Freeze

Budget Revision

Reports

Budget vs Actual

Revenue Variance

Cost Variance

Site-wise Budget

Contract-wise Budget

Alerts

Budget Exceeded

Revenue Below Target

Cost Overrun

SECTION 14 û NOTIFICATION & ESCALATION ENGINE

Channels

WhatsApp

SMS

Email

Push Notifications

Alerts

Operations

Truck Delay

Rake Delay

Fleet

Maintenance Due

Insurance Expiry

Accounts

Invoice Approved

Payment Overdue

HR

Attendance Exception

Escalation Matrix

Supervisor ? Manager ? HOD ? Management

SECTION 15 û AUDIT TRAIL

Tracks

User

Date

Time

Old Value

New Value

Device

IP Address

Applicable To

Quantities

Invoices

Expenses

Contracts

Payroll

Stock

Budgets

SECTION 16 û DASHBOARD DESIGNER

Purpose

Create custom dashboards.

Available Widgets

Quantity

Revenue

Costs

Profitability

Equipment Utilization

Labour Productivity

Stock

Collections

Budget Variance

Features

Drag & Drop

Role-Based Dashboards

Personal Dashboards

SECTION 17 û REPORT BUILDER

Purpose

Create custom reports.

Filters

Date

Site

Region

Customer

Contract

Commodity

Equipment

Outputs

PDF

Excel

CSV

Email

SECTION 18 û AI COPILOT CONFIGURATION

Purpose

Manage AI assistant settings.

Languages

English

Hindi

Telugu

Tamil

Kannada

Bengali

Marathi

Malayalam

AI Permissions

Allow:

Financial Queries

Operational Queries

HR Queries

Fleet Queries

Voice Assistant

Enable

Disable

SECTION 19 û DOCUMENT MANAGEMENT SETTINGS

Templates

Invoice

Contract

Vendor Bill

Labour Bill

Purchase Request

Storage Settings

Retention Period

Archive Policy

File Size Limits

SECTION 20 û OCR CONFIGURATION

OCR Sources

Weighbridge Slips

RR Copies

Vendor Bills

Invoices

Expense Receipts

Settings

Confidence %

Auto Verification Rules

Auto Approval Rules

SECTION 21 û CUSTOMER ACCESS MANAGEMENT

Customer Can Access

Dispatches

Receipts

Stock Position

Invoices

Reports

Quality Reports

Permissions

Controlled customer-wise.

SECTION 22 û VENDOR ACCESS MANAGEMENT

Vendor Types

Transporters

Labour Contractors

Equipment Vendors

Vendor Can Access

Bills

Payments

Utilization

Attendance

Statements

SECTION 23 û DATA IMPORT & EXPORT

Import

Employees

Assets

Customers

Vendors

Contracts

Opening Balances

Export

Transactions

Reports

Masters

SECTION 24 û SYSTEM CONFIGURATION

Financial Settings

Financial Year

Currency

Tax Configuration

Operational Settings

Quantity Units

Time Zone

Date Format

Number Series

Invoice Numbers

Contract Numbers

Employee Numbers

Asset Numbers

SECTION 25 û MOBILE APP SETTINGS

Controls

Offline Mode

GPS Mandatory

Image Mandatory

Location Tracking

Background Sync

Security

Device Binding

Session Timeout

Remote Logout

SECTION 26 û INTEGRATION MANAGEMENT

Supported Integrations

GPS Providers

Weighbridge Systems

Biometric Systems

Tally

SAP

WhatsApp API

Email Services

Banking APIs

SECTION 27 û TENANT ANALYTICS

Usage Metrics

User Statistics

Active Users

Inactive Users

Login Trends

System Usage

Storage Usage

OCR Usage

AI Usage

Mobile Sync Usage

Operational Metrics

Transactions Processed

Reports Generated

FINAL TENANT ADMIN STRUCTURE

Organization

Organization Setup

Business Unit Management

Region Management

Site Management

Department Management

Security

User Management

Role Management

Permission Management

Configuration

Master Data Management

Approval Matrix Management

Operational Rules Engine

Custom KPI & SLA Engine

Governance

Budget Management (Shared with Accounts & Operations Head)

Notification & Escalation Engine

Audit Trail

Reporting

Dashboard Designer

Report Builder

Intelligence

AI Copilot Configuration

Documents & OCR

Document Management Settings

OCR Configuration

External Access

Customer Access Management

Vendor Access Management

Platform Management

Data Import & Export

System Configuration

Mobile App Settings

Integration Management

Tenant Analytics

This is the finalized Tenant Admin Module structure aligned with the InfraOps operating
model.


