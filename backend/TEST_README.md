# Unit Testing for WareHouse Management System

This document explains how to run and extend the unit tests for the WareHouse Management System entities.

## Running Tests

### Running All Entity Tests

To run all entity model tests:

```bash
mvn test -Dtest=**/model/*Test
```

### Running Tests for Specific Modules

To run tests for a specific module (e.g., Inventory):

```bash
mvn test -Dtest=com.project.warehouse_management_system.Inventory.model.*Test
```

To run tests for another module like WareHouse:

```bash
mvn test -Dtest=com.project.warehouse_management_system.WareHouse.model.*Test
```

### Running a Specific Test Class

To run a specific test class:

```bash
mvn test -Dtest=CategoryTest
```

### Running a Specific Test Method

To run a specific test method in a test class:

```bash
mvn test -Dtest=CategoryTest#testSetAndGetName
```

## Test Structure

The test structure mirrors the main application structure:

```
src/
├── main/
│   └── java/
│       └── com/project/warehouse_management_system/
│           ├── Inventory/model
│           ├── WareHouse/model
│           ├── PurchaseOrder/model
│           ├── Shipment/model
│           └── Recommendation/model
└── test/
    └── java/
        └── com/project/warehouse_management_system/
            ├── Inventory/model
            ├── WareHouse/model
            ├── PurchaseOrder/model
            ├── Shipment/model
            └── Recommendation/model
```

## Test Configurations

Special test configurations are available in the test resources directory:

```
src/test/resources/application-test.properties
```

This file contains test-specific properties to allow tests to run without requiring external dependencies.

## Extending Tests

When adding new entity tests, follow these guidelines:

1. Place the test in the corresponding package structure mirroring the main code
2. Follow the naming convention: `[EntityName]Test.java`
3. Include tests for getters, setters and entity relationships
4. Avoid testing equals/hashCode by comparing full objects (test ID equality instead)

## Troubleshooting

If you encounter failures with Spring context loading, try adding the necessary mock configurations in the test profile.

For entity tests specifically, you can exclude the Spring context by using:

```bash
mvn test -Dtest=**/model/*Test -DexcludeGroups=ContextLoads
```
