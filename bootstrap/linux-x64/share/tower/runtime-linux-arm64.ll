; ModuleID = '/cache/values-workers-clean/guest-linux-arm64-unbound.ll'
source_filename = "Tower"
target datalayout = "e-m:e-i8:8:32-i16:16:32-i64:64-i128:128-n32:64-S128-Fn32"
target triple = "aarch64-unknown-linux-gnu"

@0 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@1 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@2 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@3 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@tower.string = private global [6 x i8] c"true\0A\00", align 1
@tower.string.1 = private global [7 x i8] c"false\0A\00", align 1
@4 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@tower.string.2 = private global [17 x i8] c"0123456789abcdef\00", align 1
@5 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@6 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@7 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@8 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@9 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@10 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@11 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@12 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@tower.string.3 = private global [2 x i8] c"\0A\00", align 1

define internal i8 @tower.fn.guest_runtime_product(i64 %0, i64 %1) {
entry:
  %count = alloca i64, align 8
  %size = alloca i64, align 8
  %maximum = alloca i64, align 8
  %limit = alloca i64, align 8
  %"control value 1.0" = alloca ptr, align 8
  %"control value 1.1" = alloca i64, align 8
  %"control value 1.2" = alloca i64, align 8
  %"control value 1.3" = alloca i64, align 8
  %"control value 1.4" = alloca i8, align 1
  %"control value 1.5" = alloca i64, align 8
  %"control value 1.6" = alloca i64, align 8
  %"control value 1.7" = alloca i64, align 8
  %"control value 1.8" = alloca i64, align 8
  %"control value 1.9" = alloca i64, align 8
  %"control value 1.10" = alloca i8, align 1
  store i64 %0, ptr %count, align 1
  store i64 %1, ptr %size, align 1
  store i64 0, ptr %maximum, align 1
  store ptr %maximum, ptr %"control value 1.0", align 1
  %2 = load ptr, ptr %"control value 1.0", align 1
  %3 = load i64, ptr %2, align 1
  store i64 %3, ptr %"control value 1.1", align 1
  %4 = load i64, ptr %"control value 1.1", align 1
  %5 = sub i64 %4, 1
  store i64 %5, ptr %"control value 1.2", align 1
  %6 = load ptr, ptr %"control value 1.0", align 1
  %7 = load i64, ptr %"control value 1.2", align 1
  store i64 %7, ptr %6, align 1
  %8 = load i64, ptr %size, align 1
  store i64 %8, ptr %"control value 1.3", align 1
  %9 = load i64, ptr %"control value 1.3", align 1
  %10 = icmp ne i64 %9, 0
  %11 = zext i1 %10 to i8
  store i8 %11, ptr %"control value 1.4", align 1
  %12 = load i8, ptr %"control value 1.4", align 1
  %13 = icmp ne i8 %12, 0
  br i1 %13, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %14 = load i64, ptr %maximum, align 1
  store i64 %14, ptr %"control value 1.5", align 1
  %15 = load i64, ptr %size, align 1
  store i64 %15, ptr %"control value 1.6", align 1
  %16 = load i64, ptr %"control value 1.5", align 1
  %17 = load i64, ptr %"control value 1.6", align 1
  %18 = icmp ne i64 %17, 0
  br i1 %18, label %valid, label %error

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.end3, %if.else
  ret i8 1

valid:                                            ; preds = %if.body
  %19 = udiv i64 %16, %17
  store i64 %19, ptr %"control value 1.7", align 1
  %20 = load i64, ptr %"control value 1.7", align 1
  store i64 %20, ptr %limit, align 1
  %21 = load i64, ptr %count, align 1
  store i64 %21, ptr %"control value 1.8", align 1
  %22 = load i64, ptr %limit, align 1
  store i64 %22, ptr %"control value 1.9", align 1
  %23 = load i64, ptr %"control value 1.8", align 1
  %24 = load i64, ptr %"control value 1.9", align 1
  %25 = icmp ugt i64 %23, %24
  %26 = zext i1 %25 to i8
  store i8 %26, ptr %"control value 1.10", align 1
  %27 = load i8, ptr %"control value 1.10", align 1
  %28 = icmp ne i8 %27, 0
  br i1 %28, label %if.body1, label %if.else2

error:                                            ; preds = %if.body
  call void @tower_trap(ptr @0, i64 15239)
  unreachable

if.body1:                                         ; preds = %valid
  ret i8 0

if.else2:                                         ; preds = %valid
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  br label %if.end
}

define ptr @tower_allocate(i64 %0, i64 %1) {
entry:
  %count = alloca i64, align 8
  %size = alloca i64, align 8
  %bytes = alloca i64, align 8
  %"control value 2.0" = alloca i64, align 8
  %"control value 2.1" = alloca i64, align 8
  %"control value 2.2" = alloca i8, align 1
  %"control value 2.3" = alloca i8, align 1
  %"control value 2.4" = alloca i64, align 8
  %"control value 2.5" = alloca i64, align 8
  %"control value 2.6" = alloca i64, align 8
  %"control value 2.7" = alloca i64, align 8
  %"control value 2.8" = alloca ptr, align 8
  store i64 %0, ptr %count, align 1
  store i64 %1, ptr %size, align 1
  %2 = load i64, ptr %count, align 1
  store i64 %2, ptr %"control value 2.0", align 1
  %3 = load i64, ptr %size, align 1
  store i64 %3, ptr %"control value 2.1", align 1
  %4 = load i64, ptr %"control value 2.0", align 1
  %5 = load i64, ptr %"control value 2.1", align 1
  %6 = call i8 @tower.fn.guest_runtime_product(i64 %4, i64 %5)
  store i8 %6, ptr %"control value 2.2", align 1
  %7 = load i8, ptr %"control value 2.2", align 1
  %8 = icmp eq i8 0, %7
  %9 = zext i1 %8 to i8
  store i8 %9, ptr %"control value 2.3", align 1
  %10 = load i8, ptr %"control value 2.3", align 1
  %11 = icmp ne i8 %10, 0
  br i1 %11, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret ptr null

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %12 = load i64, ptr %count, align 1
  store i64 %12, ptr %"control value 2.4", align 1
  %13 = load i64, ptr %size, align 1
  store i64 %13, ptr %"control value 2.5", align 1
  %14 = load i64, ptr %"control value 2.4", align 1
  %15 = load i64, ptr %"control value 2.5", align 1
  %16 = mul i64 %14, %15
  store i64 %16, ptr %"control value 2.6", align 1
  %17 = load i64, ptr %"control value 2.6", align 1
  store i64 %17, ptr %bytes, align 1
  %18 = load i64, ptr %bytes, align 1
  store i64 %18, ptr %"control value 2.7", align 1
  %19 = load i64, ptr %"control value 2.7", align 1
  %20 = call ptr @guest_host_allocate(i64 %19)
  store ptr %20, ptr %"control value 2.8", align 1
  %21 = load ptr, ptr %"control value 2.8", align 1
  ret ptr %21
}

define ptr @tower_reallocate(ptr %0, i64 %1, i64 %2) {
entry:
  %pointer = alloca ptr, align 8
  %count = alloca i64, align 8
  %size = alloca i64, align 8
  %bytes = alloca i64, align 8
  %"control value 3.0" = alloca i64, align 8
  %"control value 3.1" = alloca i64, align 8
  %"control value 3.2" = alloca i8, align 1
  %"control value 3.3" = alloca i8, align 1
  %"control value 3.4" = alloca i64, align 8
  %"control value 3.5" = alloca i64, align 8
  %"control value 3.6" = alloca i64, align 8
  %"control value 3.7" = alloca ptr, align 8
  %"control value 3.8" = alloca i64, align 8
  %"control value 3.9" = alloca ptr, align 8
  store ptr %0, ptr %pointer, align 1
  store i64 %1, ptr %count, align 1
  store i64 %2, ptr %size, align 1
  %3 = load i64, ptr %count, align 1
  store i64 %3, ptr %"control value 3.0", align 1
  %4 = load i64, ptr %size, align 1
  store i64 %4, ptr %"control value 3.1", align 1
  %5 = load i64, ptr %"control value 3.0", align 1
  %6 = load i64, ptr %"control value 3.1", align 1
  %7 = call i8 @tower.fn.guest_runtime_product(i64 %5, i64 %6)
  store i8 %7, ptr %"control value 3.2", align 1
  %8 = load i8, ptr %"control value 3.2", align 1
  %9 = icmp eq i8 0, %8
  %10 = zext i1 %9 to i8
  store i8 %10, ptr %"control value 3.3", align 1
  %11 = load i8, ptr %"control value 3.3", align 1
  %12 = icmp ne i8 %11, 0
  br i1 %12, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret ptr null

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %13 = load i64, ptr %count, align 1
  store i64 %13, ptr %"control value 3.4", align 1
  %14 = load i64, ptr %size, align 1
  store i64 %14, ptr %"control value 3.5", align 1
  %15 = load i64, ptr %"control value 3.4", align 1
  %16 = load i64, ptr %"control value 3.5", align 1
  %17 = mul i64 %15, %16
  store i64 %17, ptr %"control value 3.6", align 1
  %18 = load i64, ptr %"control value 3.6", align 1
  store i64 %18, ptr %bytes, align 1
  %19 = load ptr, ptr %pointer, align 1
  store ptr %19, ptr %"control value 3.7", align 1
  %20 = load i64, ptr %bytes, align 1
  store i64 %20, ptr %"control value 3.8", align 1
  %21 = load ptr, ptr %"control value 3.7", align 1
  %22 = load i64, ptr %"control value 3.8", align 1
  %23 = call ptr @guest_host_reallocate(ptr %21, i64 %22)
  store ptr %23, ptr %"control value 3.9", align 1
  %24 = load ptr, ptr %"control value 3.9", align 1
  ret ptr %24
}

define void @tower_deallocate(ptr %0) {
entry:
  %pointer = alloca ptr, align 8
  %"control value 4.0" = alloca ptr, align 8
  store ptr %0, ptr %pointer, align 1
  %1 = load ptr, ptr %pointer, align 1
  store ptr %1, ptr %"control value 4.0", align 1
  %2 = load ptr, ptr %"control value 4.0", align 1
  call void @guest_host_free(ptr %2)
  ret void
}

define i64 @system_call(i64 %0, i64 %1, i64 %2, i64 %3, i64 %4, i64 %5, i64 %6) {
entry:
  %result = call i64 asm sideeffect "svc 0", "={x0},{x8},{x0},{x1},{x2},{x3},{x4},{x5},~{memory}"(i64 %0, i64 %1, i64 %2, i64 %3, i64 %4, i64 %5, i64 %6)
  ret i64 %result
}

define ptr @guest_host_allocate(i64 %0) {
entry:
  %bytes = alloca i64, align 8
  %maximum = alloca i64, align 8
  %limit = alloca i64, align 8
  %total = alloca i64, align 8
  %result = alloca i64, align 8
  %address = alloca i64, align 8
  %header = alloca ptr, align 8
  %data = alloca ptr, align 8
  %"control value 6.0" = alloca ptr, align 8
  %"control value 6.1" = alloca i64, align 8
  %"control value 6.2" = alloca i64, align 8
  %"control value 6.3" = alloca i64, align 8
  %"control value 6.4" = alloca i64, align 8
  %"control value 6.5" = alloca i64, align 8
  %"control value 6.6" = alloca i64, align 8
  %"control value 6.7" = alloca i64, align 8
  %"control value 6.8" = alloca i8, align 1
  %"control value 6.9" = alloca i64, align 8
  %"control value 6.10" = alloca i64, align 8
  %"control value 6.11" = alloca i64, align 8
  %"control value 6.12" = alloca i64, align 8
  %"control value 6.13" = alloca i64, align 8
  %"control value 6.14" = alloca i64, align 8
  %"control value 6.15" = alloca i64, align 8
  %"control value 6.16" = alloca i64, align 8
  %"control value 6.17" = alloca i64, align 8
  %"control value 6.18" = alloca i64, align 8
  %"control value 6.19" = alloca i64, align 8
  %"control value 6.20" = alloca i64, align 8
  %"control value 6.21" = alloca i8, align 1
  %"control value 6.22" = alloca i64, align 8
  %"control value 6.23" = alloca ptr, align 8
  %"control value 6.24" = alloca ptr, align 8
  %"control value 6.25" = alloca ptr, align 8
  %"control value 6.26" = alloca i64, align 8
  %"control value 6.27" = alloca ptr, align 8
  %"control value 6.28" = alloca ptr, align 8
  %"control value 6.29" = alloca ptr, align 8
  %"control value 6.30" = alloca ptr, align 8
  %"control value 6.31" = alloca i64, align 8
  %"control value 6.32" = alloca ptr, align 8
  %"control value 6.33" = alloca ptr, align 8
  %"control value 6.34" = alloca ptr, align 8
  store i64 %0, ptr %bytes, align 1
  store i64 0, ptr %maximum, align 1
  store ptr %maximum, ptr %"control value 6.0", align 1
  %1 = load ptr, ptr %"control value 6.0", align 1
  %2 = load i64, ptr %1, align 1
  store i64 %2, ptr %"control value 6.1", align 1
  %3 = load i64, ptr %"control value 6.1", align 1
  %4 = sub i64 %3, 1
  store i64 %4, ptr %"control value 6.2", align 1
  %5 = load ptr, ptr %"control value 6.0", align 1
  %6 = load i64, ptr %"control value 6.2", align 1
  store i64 %6, ptr %5, align 1
  %7 = load i64, ptr %maximum, align 1
  store i64 %7, ptr %"control value 6.3", align 1
  store i64 16, ptr %"control value 6.4", align 1
  %8 = load i64, ptr %"control value 6.3", align 1
  %9 = load i64, ptr %"control value 6.4", align 1
  %10 = sub i64 %8, %9
  store i64 %10, ptr %"control value 6.5", align 1
  %11 = load i64, ptr %"control value 6.5", align 1
  store i64 %11, ptr %limit, align 1
  %12 = load i64, ptr %bytes, align 1
  store i64 %12, ptr %"control value 6.6", align 1
  %13 = load i64, ptr %limit, align 1
  store i64 %13, ptr %"control value 6.7", align 1
  %14 = load i64, ptr %"control value 6.6", align 1
  %15 = load i64, ptr %"control value 6.7", align 1
  %16 = icmp ugt i64 %14, %15
  %17 = zext i1 %16 to i8
  store i8 %17, ptr %"control value 6.8", align 1
  %18 = load i8, ptr %"control value 6.8", align 1
  %19 = icmp ne i8 %18, 0
  br i1 %19, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret ptr null

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %20 = load i64, ptr %bytes, align 1
  store i64 %20, ptr %"control value 6.9", align 1
  store i64 16, ptr %"control value 6.10", align 1
  %21 = load i64, ptr %"control value 6.9", align 1
  %22 = load i64, ptr %"control value 6.10", align 1
  %23 = add i64 %21, %22
  store i64 %23, ptr %"control value 6.11", align 1
  %24 = load i64, ptr %"control value 6.11", align 1
  store i64 %24, ptr %total, align 1
  %25 = call i64 @guest_linux_map_number()
  store i64 %25, ptr %"control value 6.12", align 1
  %26 = load i64, ptr %total, align 1
  store i64 %26, ptr %"control value 6.13", align 1
  %27 = load i64, ptr %"control value 6.13", align 1
  store i64 %27, ptr %"control value 6.14", align 1
  store i64 3, ptr %"control value 6.15", align 1
  store i64 34, ptr %"control value 6.16", align 1
  %28 = load i64, ptr %"control value 6.12", align 1
  %29 = load i64, ptr %"control value 6.14", align 1
  %30 = load i64, ptr %"control value 6.15", align 1
  %31 = load i64, ptr %"control value 6.16", align 1
  %32 = call i64 @system_call(i64 %28, i64 0, i64 %29, i64 %30, i64 %31, i64 -1, i64 0)
  store i64 %32, ptr %"control value 6.17", align 1
  %33 = load i64, ptr %"control value 6.17", align 1
  store i64 %33, ptr %result, align 1
  %34 = load i64, ptr %result, align 1
  store i64 %34, ptr %"control value 6.18", align 1
  %35 = load i64, ptr %"control value 6.18", align 1
  store i64 %35, ptr %"control value 6.19", align 1
  %36 = load i64, ptr %"control value 6.19", align 1
  store i64 %36, ptr %address, align 1
  %37 = load i64, ptr %address, align 1
  store i64 %37, ptr %"control value 6.20", align 1
  %38 = load i64, ptr %"control value 6.20", align 1
  %39 = icmp uge i64 %38, -4095
  %40 = zext i1 %39 to i8
  store i8 %40, ptr %"control value 6.21", align 1
  %41 = load i8, ptr %"control value 6.21", align 1
  %42 = icmp ne i8 %41, 0
  br i1 %42, label %if.body1, label %if.else2

if.body1:                                         ; preds = %if.end
  ret ptr null

if.else2:                                         ; preds = %if.end
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  %43 = load i64, ptr %result, align 1
  store i64 %43, ptr %"control value 6.22", align 1
  %44 = load i64, ptr %"control value 6.22", align 1
  %45 = inttoptr i64 %44 to ptr
  store ptr %45, ptr %"control value 6.23", align 1
  %46 = load ptr, ptr %"control value 6.23", align 1
  store ptr %46, ptr %header, align 1
  %47 = load ptr, ptr %header, align 1
  store ptr %47, ptr %"control value 6.24", align 1
  %48 = load ptr, ptr %"control value 6.24", align 1
  %49 = getelementptr i8, ptr %48, i64 0
  store ptr %49, ptr %"control value 6.25", align 1
  %50 = load i64, ptr %total, align 1
  store i64 %50, ptr %"control value 6.26", align 1
  %51 = load ptr, ptr %"control value 6.25", align 1
  %52 = load i64, ptr %"control value 6.26", align 1
  store i64 %52, ptr %51, align 1
  %53 = load ptr, ptr %header, align 1
  store ptr %53, ptr %"control value 6.27", align 1
  %54 = load ptr, ptr %"control value 6.27", align 1
  store ptr %54, ptr %"control value 6.28", align 1
  %55 = load ptr, ptr %"control value 6.28", align 1
  store ptr %55, ptr %data, align 1
  store ptr %data, ptr %"control value 6.29", align 1
  %56 = load ptr, ptr %data, align 1
  store ptr %56, ptr %"control value 6.30", align 1
  store i64 16, ptr %"control value 6.31", align 1
  %57 = load ptr, ptr %"control value 6.30", align 1
  %58 = load i64, ptr %"control value 6.31", align 1
  %59 = mul i64 %58, 1
  %60 = getelementptr i8, ptr %57, i64 %59
  store ptr %60, ptr %"control value 6.32", align 1
  %61 = load ptr, ptr %"control value 6.29", align 1
  %62 = load ptr, ptr %"control value 6.32", align 1
  store ptr %62, ptr %61, align 1
  %63 = load ptr, ptr %data, align 1
  store ptr %63, ptr %"control value 6.33", align 1
  %64 = load ptr, ptr %"control value 6.33", align 1
  store ptr %64, ptr %"control value 6.34", align 1
  %65 = load ptr, ptr %"control value 6.34", align 1
  ret ptr %65
}

define void @guest_host_free(ptr %0) {
entry:
  %pointer = alloca ptr, align 8
  %base = alloca ptr, align 8
  %header = alloca ptr, align 8
  %"control value 7.0" = alloca ptr, align 8
  %"control value 7.1" = alloca i8, align 1
  %"control value 7.2" = alloca ptr, align 8
  %"control value 7.3" = alloca ptr, align 8
  %"control value 7.4" = alloca ptr, align 8
  %"control value 7.5" = alloca ptr, align 8
  %"control value 7.6" = alloca i64, align 8
  %"control value 7.7" = alloca ptr, align 8
  %"control value 7.8" = alloca ptr, align 8
  %"control value 7.9" = alloca ptr, align 8
  %"control value 7.10" = alloca i64, align 8
  %"control value 7.11" = alloca ptr, align 8
  %"control value 7.12" = alloca i64, align 8
  %"control value 7.13" = alloca ptr, align 8
  %"control value 7.14" = alloca i64, align 8
  %"control value 7.15" = alloca i64, align 8
  %"control value 7.16" = alloca i64, align 8
  store ptr %0, ptr %pointer, align 1
  %1 = load ptr, ptr %pointer, align 1
  store ptr %1, ptr %"control value 7.0", align 1
  %2 = load ptr, ptr %"control value 7.0", align 1
  %3 = icmp eq ptr %2, null
  %4 = zext i1 %3 to i8
  store i8 %4, ptr %"control value 7.1", align 1
  %5 = load i8, ptr %"control value 7.1", align 1
  %6 = icmp ne i8 %5, 0
  br i1 %6, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret void

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %7 = load ptr, ptr %pointer, align 1
  store ptr %7, ptr %"control value 7.2", align 1
  %8 = load ptr, ptr %"control value 7.2", align 1
  store ptr %8, ptr %"control value 7.3", align 1
  %9 = load ptr, ptr %"control value 7.3", align 1
  store ptr %9, ptr %base, align 1
  store ptr %base, ptr %"control value 7.4", align 1
  %10 = load ptr, ptr %base, align 1
  store ptr %10, ptr %"control value 7.5", align 1
  store i64 16, ptr %"control value 7.6", align 1
  %11 = load ptr, ptr %"control value 7.5", align 1
  %12 = load i64, ptr %"control value 7.6", align 1
  %13 = mul i64 %12, 1
  %14 = sub i64 0, %13
  %15 = getelementptr i8, ptr %11, i64 %14
  store ptr %15, ptr %"control value 7.7", align 1
  %16 = load ptr, ptr %"control value 7.4", align 1
  %17 = load ptr, ptr %"control value 7.7", align 1
  store ptr %17, ptr %16, align 1
  %18 = load ptr, ptr %base, align 1
  store ptr %18, ptr %"control value 7.8", align 1
  %19 = load ptr, ptr %"control value 7.8", align 1
  store ptr %19, ptr %"control value 7.9", align 1
  %20 = load ptr, ptr %"control value 7.9", align 1
  store ptr %20, ptr %header, align 1
  %21 = call i64 @guest_linux_unmap_number()
  store i64 %21, ptr %"control value 7.10", align 1
  %22 = load ptr, ptr %base, align 1
  store ptr %22, ptr %"control value 7.11", align 1
  %23 = load ptr, ptr %"control value 7.11", align 1
  %24 = ptrtoint ptr %23 to i64
  store i64 %24, ptr %"control value 7.12", align 1
  %25 = load ptr, ptr %header, align 1
  store ptr %25, ptr %"control value 7.13", align 1
  %26 = load ptr, ptr %"control value 7.13", align 1
  %27 = getelementptr i8, ptr %26, i64 0
  %28 = load i64, ptr %27, align 1
  store i64 %28, ptr %"control value 7.14", align 1
  %29 = load i64, ptr %"control value 7.14", align 1
  store i64 %29, ptr %"control value 7.15", align 1
  %30 = load i64, ptr %"control value 7.10", align 1
  %31 = load i64, ptr %"control value 7.12", align 1
  %32 = load i64, ptr %"control value 7.15", align 1
  %33 = call i64 @system_call(i64 %30, i64 %31, i64 %32, i64 0, i64 0, i64 0, i64 0)
  store i64 %33, ptr %"control value 7.16", align 1
  ret void
}

define ptr @guest_host_reallocate(ptr %0, i64 %1) {
entry:
  %pointer = alloca ptr, align 8
  %bytes = alloca i64, align 8
  %base = alloca ptr, align 8
  %header = alloca ptr, align 8
  %old = alloca i64, align 8
  %result = alloca ptr, align 8
  %"control value 8.0" = alloca ptr, align 8
  %"control value 8.1" = alloca i8, align 1
  %"control value 8.2" = alloca i64, align 8
  %"control value 8.3" = alloca ptr, align 8
  %"control value 8.4" = alloca i64, align 8
  %"control value 8.5" = alloca i8, align 1
  %"control value 8.6" = alloca ptr, align 8
  %"control value 8.7" = alloca ptr, align 8
  %"control value 8.8" = alloca ptr, align 8
  %"control value 8.9" = alloca ptr, align 8
  %"control value 8.10" = alloca ptr, align 8
  %"control value 8.11" = alloca i64, align 8
  %"control value 8.12" = alloca ptr, align 8
  %"control value 8.13" = alloca ptr, align 8
  %"control value 8.14" = alloca ptr, align 8
  %"control value 8.15" = alloca ptr, align 8
  %"control value 8.16" = alloca i64, align 8
  %"control value 8.17" = alloca i64, align 8
  %"control value 8.18" = alloca i64, align 8
  %"control value 8.19" = alloca i64, align 8
  %"control value 8.20" = alloca ptr, align 8
  %"control value 8.21" = alloca ptr, align 8
  %"control value 8.22" = alloca i8, align 1
  %"control value 8.23" = alloca i64, align 8
  %"control value 8.24" = alloca i64, align 8
  %"control value 8.25" = alloca i8, align 1
  %"control value 8.26" = alloca ptr, align 8
  %"control value 8.27" = alloca i64, align 8
  %"control value 8.28" = alloca ptr, align 8
  %"control value 8.29" = alloca ptr, align 8
  %"control value 8.30" = alloca i64, align 8
  %"control value 8.31" = alloca ptr, align 8
  %"control value 8.32" = alloca ptr, align 8
  store ptr %0, ptr %pointer, align 1
  store i64 %1, ptr %bytes, align 1
  %2 = load ptr, ptr %pointer, align 1
  store ptr %2, ptr %"control value 8.0", align 1
  %3 = load ptr, ptr %"control value 8.0", align 1
  %4 = icmp eq ptr %3, null
  %5 = zext i1 %4 to i8
  store i8 %5, ptr %"control value 8.1", align 1
  %6 = load i8, ptr %"control value 8.1", align 1
  %7 = icmp ne i8 %6, 0
  br i1 %7, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %8 = load i64, ptr %bytes, align 1
  store i64 %8, ptr %"control value 8.2", align 1
  %9 = load i64, ptr %"control value 8.2", align 1
  %10 = call ptr @guest_host_allocate(i64 %9)
  store ptr %10, ptr %"control value 8.3", align 1
  %11 = load ptr, ptr %"control value 8.3", align 1
  ret ptr %11

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %12 = load i64, ptr %bytes, align 1
  store i64 %12, ptr %"control value 8.4", align 1
  %13 = load i64, ptr %"control value 8.4", align 1
  %14 = icmp eq i64 %13, 0
  %15 = zext i1 %14 to i8
  store i8 %15, ptr %"control value 8.5", align 1
  %16 = load i8, ptr %"control value 8.5", align 1
  %17 = icmp ne i8 %16, 0
  br i1 %17, label %if.body1, label %if.else2

if.body1:                                         ; preds = %if.end
  %18 = load ptr, ptr %pointer, align 1
  store ptr %18, ptr %"control value 8.6", align 1
  %19 = load ptr, ptr %"control value 8.6", align 1
  call void @guest_host_free(ptr %19)
  ret ptr null

if.else2:                                         ; preds = %if.end
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  %20 = load ptr, ptr %pointer, align 1
  store ptr %20, ptr %"control value 8.7", align 1
  %21 = load ptr, ptr %"control value 8.7", align 1
  store ptr %21, ptr %"control value 8.8", align 1
  %22 = load ptr, ptr %"control value 8.8", align 1
  store ptr %22, ptr %base, align 1
  store ptr %base, ptr %"control value 8.9", align 1
  %23 = load ptr, ptr %base, align 1
  store ptr %23, ptr %"control value 8.10", align 1
  store i64 16, ptr %"control value 8.11", align 1
  %24 = load ptr, ptr %"control value 8.10", align 1
  %25 = load i64, ptr %"control value 8.11", align 1
  %26 = mul i64 %25, 1
  %27 = sub i64 0, %26
  %28 = getelementptr i8, ptr %24, i64 %27
  store ptr %28, ptr %"control value 8.12", align 1
  %29 = load ptr, ptr %"control value 8.9", align 1
  %30 = load ptr, ptr %"control value 8.12", align 1
  store ptr %30, ptr %29, align 1
  %31 = load ptr, ptr %base, align 1
  store ptr %31, ptr %"control value 8.13", align 1
  %32 = load ptr, ptr %"control value 8.13", align 1
  store ptr %32, ptr %"control value 8.14", align 1
  %33 = load ptr, ptr %"control value 8.14", align 1
  store ptr %33, ptr %header, align 1
  %34 = load ptr, ptr %header, align 1
  store ptr %34, ptr %"control value 8.15", align 1
  %35 = load ptr, ptr %"control value 8.15", align 1
  %36 = getelementptr i8, ptr %35, i64 0
  %37 = load i64, ptr %36, align 1
  store i64 %37, ptr %"control value 8.16", align 1
  store i64 16, ptr %"control value 8.17", align 1
  %38 = load i64, ptr %"control value 8.16", align 1
  %39 = load i64, ptr %"control value 8.17", align 1
  %40 = sub i64 %38, %39
  store i64 %40, ptr %"control value 8.18", align 1
  %41 = load i64, ptr %"control value 8.18", align 1
  store i64 %41, ptr %old, align 1
  %42 = load i64, ptr %bytes, align 1
  store i64 %42, ptr %"control value 8.19", align 1
  %43 = load i64, ptr %"control value 8.19", align 1
  %44 = call ptr @guest_host_allocate(i64 %43)
  store ptr %44, ptr %"control value 8.20", align 1
  %45 = load ptr, ptr %"control value 8.20", align 1
  store ptr %45, ptr %result, align 1
  %46 = load ptr, ptr %result, align 1
  store ptr %46, ptr %"control value 8.21", align 1
  %47 = load ptr, ptr %"control value 8.21", align 1
  %48 = icmp ne ptr %47, null
  %49 = zext i1 %48 to i8
  store i8 %49, ptr %"control value 8.22", align 1
  %50 = load i8, ptr %"control value 8.22", align 1
  %51 = icmp ne i8 %50, 0
  br i1 %51, label %if.body4, label %if.else5

if.body4:                                         ; preds = %if.end3
  %52 = load i64, ptr %bytes, align 1
  store i64 %52, ptr %"control value 8.23", align 1
  %53 = load i64, ptr %old, align 1
  store i64 %53, ptr %"control value 8.24", align 1
  %54 = load i64, ptr %"control value 8.23", align 1
  %55 = load i64, ptr %"control value 8.24", align 1
  %56 = icmp ult i64 %54, %55
  %57 = zext i1 %56 to i8
  store i8 %57, ptr %"control value 8.25", align 1
  %58 = load i8, ptr %"control value 8.25", align 1
  %59 = icmp ne i8 %58, 0
  br i1 %59, label %if.body7, label %if.else8

if.else5:                                         ; preds = %if.end3
  br label %if.end6

if.end6:                                          ; preds = %if.end9, %if.else5
  %60 = load ptr, ptr %result, align 1
  store ptr %60, ptr %"control value 8.32", align 1
  %61 = load ptr, ptr %"control value 8.32", align 1
  ret ptr %61

if.body7:                                         ; preds = %if.body4
  store ptr %old, ptr %"control value 8.26", align 1
  %62 = load i64, ptr %bytes, align 1
  store i64 %62, ptr %"control value 8.27", align 1
  %63 = load ptr, ptr %"control value 8.26", align 1
  %64 = load i64, ptr %"control value 8.27", align 1
  store i64 %64, ptr %63, align 1
  br label %if.end9

if.else8:                                         ; preds = %if.body4
  br label %if.end9

if.end9:                                          ; preds = %if.else8, %if.body7
  %65 = load ptr, ptr %result, align 1
  store ptr %65, ptr %"control value 8.28", align 1
  %66 = load ptr, ptr %pointer, align 1
  store ptr %66, ptr %"control value 8.29", align 1
  %67 = load i64, ptr %old, align 1
  store i64 %67, ptr %"control value 8.30", align 1
  %68 = load ptr, ptr %"control value 8.28", align 1
  %69 = load ptr, ptr %"control value 8.29", align 1
  %70 = load i64, ptr %"control value 8.30", align 1
  call void @llvm.memmove.p0.p0.i64(ptr align 1 %68, ptr align 1 %69, i64 %70, i1 false)
  %71 = load ptr, ptr %pointer, align 1
  store ptr %71, ptr %"control value 8.31", align 1
  %72 = load ptr, ptr %"control value 8.31", align 1
  call void @guest_host_free(ptr %72)
  br label %if.end6
}

define i64 @platform_write(i32 %0, ptr %1, i64 %2) {
entry:
  %stream = alloca i32, align 4
  %bytes = alloca ptr, align 8
  %count = alloca i64, align 8
  %valid = alloca i8, align 1
  %result = alloca i64, align 8
  %"control value 9.0" = alloca i32, align 4
  %"control value 9.1" = alloca i8, align 1
  %"control value 9.2" = alloca ptr, align 8
  %"control value 9.3" = alloca i8, align 1
  %"control value 9.4" = alloca i8, align 1
  %"control value 9.5" = alloca i8, align 1
  %"control value 9.6" = alloca i32, align 4
  %"control value 9.7" = alloca i8, align 1
  %"control value 9.8" = alloca i8, align 1
  %"control value 9.9" = alloca i8, align 1
  %"control value 9.10" = alloca i64, align 8
  %"control value 9.11" = alloca i32, align 4
  %"control value 9.12" = alloca i64, align 8
  %"control value 9.13" = alloca ptr, align 8
  %"control value 9.14" = alloca i64, align 8
  %"control value 9.15" = alloca i64, align 8
  %"control value 9.16" = alloca i64, align 8
  %"control value 9.17" = alloca i64, align 8
  %"control value 9.18" = alloca i64, align 8
  %"control value 9.19" = alloca i8, align 1
  %"control value 9.20" = alloca i64, align 8
  store i32 %0, ptr %stream, align 1
  store ptr %1, ptr %bytes, align 1
  store i64 %2, ptr %count, align 1
  %3 = load i32, ptr %stream, align 1
  store i32 %3, ptr %"control value 9.0", align 1
  %4 = load i32, ptr %"control value 9.0", align 1
  %5 = icmp eq i32 %4, 1
  %6 = zext i1 %5 to i8
  store i8 %6, ptr %"control value 9.1", align 1
  %7 = load i8, ptr %"control value 9.1", align 1
  store i8 %7, ptr %valid, align 1
  store ptr %valid, ptr %"control value 9.2", align 1
  %8 = load ptr, ptr %"control value 9.2", align 1
  %9 = load i8, ptr %8, align 1
  store i8 %9, ptr %"control value 9.3", align 1
  %10 = load i8, ptr %"control value 9.3", align 1
  store i8 %10, ptr %"control value 9.4", align 1
  %11 = load i8, ptr %"control value 9.4", align 1
  store i8 %11, ptr %"control value 9.5", align 1
  %12 = load i8, ptr %"control value 9.4", align 1
  %13 = icmp ne i8 %12, 0
  br i1 %13, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  br label %if.end

if.else:                                          ; preds = %entry
  %14 = load i32, ptr %stream, align 1
  store i32 %14, ptr %"control value 9.6", align 1
  %15 = load i32, ptr %"control value 9.6", align 1
  %16 = icmp eq i32 %15, 2
  %17 = zext i1 %16 to i8
  store i8 %17, ptr %"control value 9.7", align 1
  %18 = load i8, ptr %"control value 9.7", align 1
  store i8 %18, ptr %"control value 9.5", align 1
  %19 = load ptr, ptr %"control value 9.2", align 1
  %20 = load i8, ptr %"control value 9.7", align 1
  store i8 %20, ptr %19, align 1
  br label %if.end

if.end:                                           ; preds = %if.else, %if.body
  %21 = load i8, ptr %valid, align 1
  store i8 %21, ptr %"control value 9.8", align 1
  %22 = load i8, ptr %"control value 9.8", align 1
  %23 = icmp eq i8 0, %22
  %24 = zext i1 %23 to i8
  store i8 %24, ptr %"control value 9.9", align 1
  %25 = load i8, ptr %"control value 9.9", align 1
  %26 = icmp ne i8 %25, 0
  br i1 %26, label %if.body1, label %if.else2

if.body1:                                         ; preds = %if.end
  ret i64 -1

if.else2:                                         ; preds = %if.end
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  %27 = call i64 @guest_linux_write_number()
  store i64 %27, ptr %"control value 9.10", align 1
  %28 = load i32, ptr %stream, align 1
  store i32 %28, ptr %"control value 9.11", align 1
  %29 = load i32, ptr %"control value 9.11", align 1
  %30 = zext i32 %29 to i64
  %31 = icmp ule i64 %30, 9223372036854775807
  %32 = and i1 true, %31
  br i1 %32, label %valid4, label %error

valid4:                                           ; preds = %if.end3
  %33 = zext i32 %29 to i64
  store i64 %33, ptr %"control value 9.12", align 1
  %34 = load ptr, ptr %bytes, align 1
  store ptr %34, ptr %"control value 9.13", align 1
  %35 = load ptr, ptr %"control value 9.13", align 1
  %36 = ptrtoint ptr %35 to i64
  store i64 %36, ptr %"control value 9.14", align 1
  %37 = load i64, ptr %count, align 1
  store i64 %37, ptr %"control value 9.15", align 1
  %38 = load i64, ptr %"control value 9.15", align 1
  store i64 %38, ptr %"control value 9.16", align 1
  %39 = load i64, ptr %"control value 9.10", align 1
  %40 = load i64, ptr %"control value 9.12", align 1
  %41 = load i64, ptr %"control value 9.14", align 1
  %42 = load i64, ptr %"control value 9.16", align 1
  %43 = call i64 @system_call(i64 %39, i64 %40, i64 %41, i64 %42, i64 0, i64 0, i64 0)
  store i64 %43, ptr %"control value 9.17", align 1
  %44 = load i64, ptr %"control value 9.17", align 1
  store i64 %44, ptr %result, align 1
  %45 = load i64, ptr %result, align 1
  store i64 %45, ptr %"control value 9.18", align 1
  %46 = load i64, ptr %"control value 9.18", align 1
  %47 = icmp slt i64 %46, 0
  %48 = zext i1 %47 to i8
  store i8 %48, ptr %"control value 9.19", align 1
  %49 = load i8, ptr %"control value 9.19", align 1
  %50 = icmp ne i8 %49, 0
  br i1 %50, label %if.body5, label %if.else6

error:                                            ; preds = %if.end3
  call void @tower_trap(ptr @1, i64 16381)
  unreachable

if.body5:                                         ; preds = %valid4
  ret i64 -1

if.else6:                                         ; preds = %valid4
  br label %if.end7

if.end7:                                          ; preds = %if.else6
  %51 = load i64, ptr %result, align 1
  store i64 %51, ptr %"control value 9.20", align 1
  %52 = load i64, ptr %"control value 9.20", align 1
  ret i64 %52
}

define void @guest_exit(i32 %0) {
entry:
  %status = alloca i32, align 4
  %"control value 10.0" = alloca i64, align 8
  %"control value 10.1" = alloca i32, align 4
  %"control value 10.2" = alloca i64, align 8
  %"control value 10.3" = alloca i64, align 8
  store i32 %0, ptr %status, align 1
  %1 = call i64 @guest_linux_exit_number()
  store i64 %1, ptr %"control value 10.0", align 1
  %2 = load i32, ptr %status, align 1
  store i32 %2, ptr %"control value 10.1", align 1
  %3 = load i32, ptr %"control value 10.1", align 1
  %4 = sext i32 %3 to i64
  %5 = icmp sge i64 %4, -9223372036854775808
  %6 = icmp sle i64 %4, 9223372036854775807
  %7 = and i1 %5, %6
  br i1 %7, label %valid, label %error

valid:                                            ; preds = %entry
  %8 = sext i32 %3 to i64
  store i64 %8, ptr %"control value 10.2", align 1
  %9 = load i64, ptr %"control value 10.0", align 1
  %10 = load i64, ptr %"control value 10.2", align 1
  %11 = call i64 @system_call(i64 %9, i64 %10, i64 0, i64 0, i64 0, i64 0, i64 0)
  store i64 %11, ptr %"control value 10.3", align 1
  ret void

error:                                            ; preds = %entry
  call void @tower_trap(ptr @2, i64 16381)
  unreachable
}

define i64 @guest_linux_write_number() {
entry:
  ret i64 64
}

define i64 @guest_linux_exit_number() {
entry:
  ret i64 93
}

define i64 @guest_linux_map_number() {
entry:
  ret i64 222
}

define i64 @guest_linux_unmap_number() {
entry:
  ret i64 215
}

define ptr @memcpy(ptr %0, ptr %1, i64 %2) {
entry:
  %destination = alloca ptr, align 8
  %source = alloca ptr, align 8
  %count = alloca i64, align 8
  %out = alloca ptr, align 8
  %input = alloca ptr, align 8
  %i = alloca i64, align 8
  %"control check 15.0" = alloca i8, align 1
  %"control value 15.0" = alloca ptr, align 8
  %"control value 15.1" = alloca ptr, align 8
  %"control value 15.2" = alloca ptr, align 8
  %"control value 15.3" = alloca ptr, align 8
  %"control value 15.4" = alloca i64, align 8
  %"control value 15.5" = alloca i64, align 8
  %"control value 15.6" = alloca i8, align 1
  %"control value 15.7" = alloca i8, align 1
  %"control value 15.8" = alloca ptr, align 8
  %"control value 15.9" = alloca i64, align 8
  %"control value 15.10" = alloca ptr, align 8
  %"control value 15.11" = alloca ptr, align 8
  %"control value 15.12" = alloca i64, align 8
  %"control value 15.13" = alloca i8, align 1
  %"control value 15.14" = alloca ptr, align 8
  %"control value 15.15" = alloca i64, align 8
  %"control value 15.16" = alloca i64, align 8
  %"control value 15.17" = alloca ptr, align 8
  store ptr %0, ptr %destination, align 1
  store ptr %1, ptr %source, align 1
  store i64 %2, ptr %count, align 1
  %3 = load ptr, ptr %destination, align 1
  store ptr %3, ptr %"control value 15.0", align 1
  %4 = load ptr, ptr %"control value 15.0", align 1
  store ptr %4, ptr %"control value 15.1", align 1
  %5 = load ptr, ptr %"control value 15.1", align 1
  store ptr %5, ptr %out, align 1
  %6 = load ptr, ptr %source, align 1
  store ptr %6, ptr %"control value 15.2", align 1
  %7 = load ptr, ptr %"control value 15.2", align 1
  store ptr %7, ptr %"control value 15.3", align 1
  %8 = load ptr, ptr %"control value 15.3", align 1
  store ptr %8, ptr %input, align 1
  store i64 0, ptr %i, align 1
  br label %loop

loop:                                             ; preds = %if.end, %entry
  %9 = load i64, ptr %i, align 1
  store i64 %9, ptr %"control value 15.4", align 1
  %10 = load i64, ptr %count, align 1
  store i64 %10, ptr %"control value 15.5", align 1
  %11 = load i64, ptr %"control value 15.4", align 1
  %12 = load i64, ptr %"control value 15.5", align 1
  %13 = icmp ult i64 %11, %12
  %14 = zext i1 %13 to i8
  store i8 %14, ptr %"control value 15.6", align 1
  %15 = load i8, ptr %"control value 15.6", align 1
  store i8 %15, ptr %"control check 15.0", align 1
  %16 = load i8, ptr %"control check 15.0", align 1
  store i8 %16, ptr %"control value 15.7", align 1
  %17 = load i8, ptr %"control value 15.7", align 1
  %18 = icmp ne i8 %17, 0
  br i1 %18, label %if.body, label %if.else

loop.end:                                         ; preds = %if.else
  %19 = load ptr, ptr %destination, align 1
  store ptr %19, ptr %"control value 15.17", align 1
  %20 = load ptr, ptr %"control value 15.17", align 1
  ret ptr %20

if.body:                                          ; preds = %loop
  %21 = load ptr, ptr %out, align 1
  store ptr %21, ptr %"control value 15.8", align 1
  %22 = load i64, ptr %i, align 1
  store i64 %22, ptr %"control value 15.9", align 1
  %23 = load ptr, ptr %"control value 15.8", align 1
  %24 = load i64, ptr %"control value 15.9", align 1
  %25 = mul i64 %24, 1
  %26 = getelementptr i8, ptr %23, i64 %25
  store ptr %26, ptr %"control value 15.10", align 1
  %27 = load ptr, ptr %input, align 1
  store ptr %27, ptr %"control value 15.11", align 1
  %28 = load i64, ptr %i, align 1
  store i64 %28, ptr %"control value 15.12", align 1
  %29 = load ptr, ptr %"control value 15.11", align 1
  %30 = load i64, ptr %"control value 15.12", align 1
  %31 = mul i64 %30, 1
  %32 = getelementptr i8, ptr %29, i64 %31
  %33 = load i8, ptr %32, align 1
  store i8 %33, ptr %"control value 15.13", align 1
  %34 = load ptr, ptr %"control value 15.10", align 1
  %35 = load i8, ptr %"control value 15.13", align 1
  store i8 %35, ptr %34, align 1
  store ptr %i, ptr %"control value 15.14", align 1
  %36 = load ptr, ptr %"control value 15.14", align 1
  %37 = load i64, ptr %36, align 1
  store i64 %37, ptr %"control value 15.15", align 1
  %38 = load i64, ptr %"control value 15.15", align 1
  %39 = add i64 %38, 1
  store i64 %39, ptr %"control value 15.16", align 1
  %40 = load ptr, ptr %"control value 15.14", align 1
  %41 = load i64, ptr %"control value 15.16", align 1
  store i64 %41, ptr %40, align 1
  br label %if.end

if.else:                                          ; preds = %loop
  br label %loop.end

if.end:                                           ; preds = %if.body
  br label %loop
}

define ptr @memmove(ptr %0, ptr %1, i64 %2) {
entry:
  %destination = alloca ptr, align 8
  %source = alloca ptr, align 8
  %count = alloca i64, align 8
  %out = alloca ptr, align 8
  %input = alloca ptr, align 8
  %i = alloca i64, align 8
  %"control check 16.0" = alloca i8, align 1
  %"control value 16.0" = alloca ptr, align 8
  %"control value 16.1" = alloca ptr, align 8
  %"control value 16.2" = alloca ptr, align 8
  %"control value 16.3" = alloca ptr, align 8
  %"control value 16.4" = alloca ptr, align 8
  %"control value 16.5" = alloca i64, align 8
  %"control value 16.6" = alloca ptr, align 8
  %"control value 16.7" = alloca i64, align 8
  %"control value 16.8" = alloca i8, align 1
  %"control value 16.9" = alloca ptr, align 8
  %"control value 16.10" = alloca ptr, align 8
  %"control value 16.11" = alloca i64, align 8
  %"control value 16.12" = alloca ptr, align 8
  %"control value 16.13" = alloca i64, align 8
  %"control value 16.14" = alloca i64, align 8
  %"control value 16.15" = alloca i8, align 1
  %"control value 16.16" = alloca i8, align 1
  %"control value 16.17" = alloca ptr, align 8
  %"control value 16.18" = alloca i64, align 8
  %"control value 16.19" = alloca i64, align 8
  %"control value 16.20" = alloca ptr, align 8
  %"control value 16.21" = alloca i64, align 8
  %"control value 16.22" = alloca ptr, align 8
  %"control value 16.23" = alloca ptr, align 8
  %"control value 16.24" = alloca i64, align 8
  %"control value 16.25" = alloca i8, align 1
  %"control value 16.26" = alloca ptr, align 8
  store ptr %0, ptr %destination, align 1
  store ptr %1, ptr %source, align 1
  store i64 %2, ptr %count, align 1
  %3 = load ptr, ptr %destination, align 1
  store ptr %3, ptr %"control value 16.0", align 1
  %4 = load ptr, ptr %"control value 16.0", align 1
  store ptr %4, ptr %"control value 16.1", align 1
  %5 = load ptr, ptr %"control value 16.1", align 1
  store ptr %5, ptr %out, align 1
  %6 = load ptr, ptr %source, align 1
  store ptr %6, ptr %"control value 16.2", align 1
  %7 = load ptr, ptr %"control value 16.2", align 1
  store ptr %7, ptr %"control value 16.3", align 1
  %8 = load ptr, ptr %"control value 16.3", align 1
  store ptr %8, ptr %input, align 1
  %9 = load ptr, ptr %out, align 1
  store ptr %9, ptr %"control value 16.4", align 1
  %10 = load ptr, ptr %"control value 16.4", align 1
  %11 = ptrtoint ptr %10 to i64
  store i64 %11, ptr %"control value 16.5", align 1
  %12 = load ptr, ptr %input, align 1
  store ptr %12, ptr %"control value 16.6", align 1
  %13 = load ptr, ptr %"control value 16.6", align 1
  %14 = ptrtoint ptr %13 to i64
  store i64 %14, ptr %"control value 16.7", align 1
  %15 = load i64, ptr %"control value 16.5", align 1
  %16 = load i64, ptr %"control value 16.7", align 1
  %17 = icmp ult i64 %15, %16
  %18 = zext i1 %17 to i8
  store i8 %18, ptr %"control value 16.8", align 1
  %19 = load i8, ptr %"control value 16.8", align 1
  %20 = icmp ne i8 %19, 0
  br i1 %20, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %21 = load ptr, ptr %destination, align 1
  store ptr %21, ptr %"control value 16.9", align 1
  %22 = load ptr, ptr %source, align 1
  store ptr %22, ptr %"control value 16.10", align 1
  %23 = load i64, ptr %count, align 1
  store i64 %23, ptr %"control value 16.11", align 1
  %24 = load ptr, ptr %"control value 16.9", align 1
  %25 = load ptr, ptr %"control value 16.10", align 1
  %26 = load i64, ptr %"control value 16.11", align 1
  %27 = call ptr @memcpy(ptr %24, ptr %25, i64 %26)
  store ptr %27, ptr %"control value 16.12", align 1
  %28 = load ptr, ptr %"control value 16.12", align 1
  ret ptr %28

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %29 = load i64, ptr %count, align 1
  store i64 %29, ptr %"control value 16.13", align 1
  %30 = load i64, ptr %"control value 16.13", align 1
  store i64 %30, ptr %i, align 1
  br label %loop

loop:                                             ; preds = %if.end3, %if.end
  %31 = load i64, ptr %i, align 1
  store i64 %31, ptr %"control value 16.14", align 1
  %32 = load i64, ptr %"control value 16.14", align 1
  %33 = icmp ne i64 %32, 0
  %34 = zext i1 %33 to i8
  store i8 %34, ptr %"control value 16.15", align 1
  %35 = load i8, ptr %"control value 16.15", align 1
  store i8 %35, ptr %"control check 16.0", align 1
  %36 = load i8, ptr %"control check 16.0", align 1
  store i8 %36, ptr %"control value 16.16", align 1
  %37 = load i8, ptr %"control value 16.16", align 1
  %38 = icmp ne i8 %37, 0
  br i1 %38, label %if.body1, label %if.else2

loop.end:                                         ; preds = %if.else2
  %39 = load ptr, ptr %destination, align 1
  store ptr %39, ptr %"control value 16.26", align 1
  %40 = load ptr, ptr %"control value 16.26", align 1
  ret ptr %40

if.body1:                                         ; preds = %loop
  store ptr %i, ptr %"control value 16.17", align 1
  %41 = load ptr, ptr %"control value 16.17", align 1
  %42 = load i64, ptr %41, align 1
  store i64 %42, ptr %"control value 16.18", align 1
  %43 = load i64, ptr %"control value 16.18", align 1
  %44 = sub i64 %43, 1
  store i64 %44, ptr %"control value 16.19", align 1
  %45 = load ptr, ptr %"control value 16.17", align 1
  %46 = load i64, ptr %"control value 16.19", align 1
  store i64 %46, ptr %45, align 1
  %47 = load ptr, ptr %out, align 1
  store ptr %47, ptr %"control value 16.20", align 1
  %48 = load i64, ptr %i, align 1
  store i64 %48, ptr %"control value 16.21", align 1
  %49 = load ptr, ptr %"control value 16.20", align 1
  %50 = load i64, ptr %"control value 16.21", align 1
  %51 = mul i64 %50, 1
  %52 = getelementptr i8, ptr %49, i64 %51
  store ptr %52, ptr %"control value 16.22", align 1
  %53 = load ptr, ptr %input, align 1
  store ptr %53, ptr %"control value 16.23", align 1
  %54 = load i64, ptr %i, align 1
  store i64 %54, ptr %"control value 16.24", align 1
  %55 = load ptr, ptr %"control value 16.23", align 1
  %56 = load i64, ptr %"control value 16.24", align 1
  %57 = mul i64 %56, 1
  %58 = getelementptr i8, ptr %55, i64 %57
  %59 = load i8, ptr %58, align 1
  store i8 %59, ptr %"control value 16.25", align 1
  %60 = load ptr, ptr %"control value 16.22", align 1
  %61 = load i8, ptr %"control value 16.25", align 1
  store i8 %61, ptr %60, align 1
  br label %if.end3

if.else2:                                         ; preds = %loop
  br label %loop.end

if.end3:                                          ; preds = %if.body1
  br label %loop
}

define ptr @memset(ptr %0, i32 %1, i64 %2) {
entry:
  %destination = alloca ptr, align 8
  %value = alloca i32, align 4
  %count = alloca i64, align 8
  %out = alloca ptr, align 8
  %low = alloca i32, align 4
  %byte = alloca i8, align 1
  %i = alloca i64, align 8
  %"control check 17.0" = alloca i8, align 1
  %"control value 17.0" = alloca ptr, align 8
  %"control value 17.1" = alloca ptr, align 8
  %"control value 17.2" = alloca i32, align 4
  %"control value 17.3" = alloca i32, align 4
  %"control value 17.4" = alloca i32, align 4
  %"control value 17.5" = alloca i32, align 4
  %"control value 17.6" = alloca i8, align 1
  %"control value 17.7" = alloca i64, align 8
  %"control value 17.8" = alloca i64, align 8
  %"control value 17.9" = alloca i8, align 1
  %"control value 17.10" = alloca i8, align 1
  %"control value 17.11" = alloca ptr, align 8
  %"control value 17.12" = alloca i64, align 8
  %"control value 17.13" = alloca ptr, align 8
  %"control value 17.14" = alloca i8, align 1
  %"control value 17.15" = alloca ptr, align 8
  %"control value 17.16" = alloca i64, align 8
  %"control value 17.17" = alloca i64, align 8
  %"control value 17.18" = alloca ptr, align 8
  store ptr %0, ptr %destination, align 1
  store i32 %1, ptr %value, align 1
  store i64 %2, ptr %count, align 1
  %3 = load ptr, ptr %destination, align 1
  store ptr %3, ptr %"control value 17.0", align 1
  %4 = load ptr, ptr %"control value 17.0", align 1
  store ptr %4, ptr %"control value 17.1", align 1
  %5 = load ptr, ptr %"control value 17.1", align 1
  store ptr %5, ptr %out, align 1
  %6 = load i32, ptr %value, align 1
  store i32 %6, ptr %"control value 17.2", align 1
  %7 = load i32, ptr %"control value 17.2", align 1
  store i32 %7, ptr %"control value 17.3", align 1
  %8 = load i32, ptr %"control value 17.3", align 1
  %9 = and i32 %8, 255
  store i32 %9, ptr %"control value 17.4", align 1
  %10 = load i32, ptr %"control value 17.4", align 1
  store i32 %10, ptr %low, align 1
  %11 = load i32, ptr %low, align 1
  store i32 %11, ptr %"control value 17.5", align 1
  %12 = load i32, ptr %"control value 17.5", align 1
  %13 = zext i32 %12 to i64
  %14 = icmp ule i64 %13, 255
  %15 = and i1 true, %14
  br i1 %15, label %valid, label %error

valid:                                            ; preds = %entry
  %16 = trunc i32 %12 to i8
  store i8 %16, ptr %"control value 17.6", align 1
  %17 = load i8, ptr %"control value 17.6", align 1
  store i8 %17, ptr %byte, align 1
  store i64 0, ptr %i, align 1
  br label %loop

error:                                            ; preds = %entry
  call void @tower_trap(ptr @3, i64 19407)
  unreachable

loop:                                             ; preds = %if.end, %valid
  %18 = load i64, ptr %i, align 1
  store i64 %18, ptr %"control value 17.7", align 1
  %19 = load i64, ptr %count, align 1
  store i64 %19, ptr %"control value 17.8", align 1
  %20 = load i64, ptr %"control value 17.7", align 1
  %21 = load i64, ptr %"control value 17.8", align 1
  %22 = icmp ult i64 %20, %21
  %23 = zext i1 %22 to i8
  store i8 %23, ptr %"control value 17.9", align 1
  %24 = load i8, ptr %"control value 17.9", align 1
  store i8 %24, ptr %"control check 17.0", align 1
  %25 = load i8, ptr %"control check 17.0", align 1
  store i8 %25, ptr %"control value 17.10", align 1
  %26 = load i8, ptr %"control value 17.10", align 1
  %27 = icmp ne i8 %26, 0
  br i1 %27, label %if.body, label %if.else

loop.end:                                         ; preds = %if.else
  %28 = load ptr, ptr %destination, align 1
  store ptr %28, ptr %"control value 17.18", align 1
  %29 = load ptr, ptr %"control value 17.18", align 1
  ret ptr %29

if.body:                                          ; preds = %loop
  %30 = load ptr, ptr %out, align 1
  store ptr %30, ptr %"control value 17.11", align 1
  %31 = load i64, ptr %i, align 1
  store i64 %31, ptr %"control value 17.12", align 1
  %32 = load ptr, ptr %"control value 17.11", align 1
  %33 = load i64, ptr %"control value 17.12", align 1
  %34 = mul i64 %33, 1
  %35 = getelementptr i8, ptr %32, i64 %34
  store ptr %35, ptr %"control value 17.13", align 1
  %36 = load i8, ptr %byte, align 1
  store i8 %36, ptr %"control value 17.14", align 1
  %37 = load ptr, ptr %"control value 17.13", align 1
  %38 = load i8, ptr %"control value 17.14", align 1
  store i8 %38, ptr %37, align 1
  store ptr %i, ptr %"control value 17.15", align 1
  %39 = load ptr, ptr %"control value 17.15", align 1
  %40 = load i64, ptr %39, align 1
  store i64 %40, ptr %"control value 17.16", align 1
  %41 = load i64, ptr %"control value 17.16", align 1
  %42 = add i64 %41, 1
  store i64 %42, ptr %"control value 17.17", align 1
  %43 = load ptr, ptr %"control value 17.15", align 1
  %44 = load i64, ptr %"control value 17.17", align 1
  store i64 %44, ptr %43, align 1
  br label %if.end

if.else:                                          ; preds = %loop
  br label %loop.end

if.end:                                           ; preds = %if.body
  br label %loop
}

define i64 @runtime_format_value(ptr %0, i64 %1, i32 %2, i64 %3, i32 %4) {
entry:
  %output = alloca ptr, align 8
  %capacity = alloca i64, align 8
  %kind = alloca i32, align 4
  %value = alloca i64, align 8
  %pointer_bytes = alloca i32, align 4
  %buffer = alloca [80 x i8], align 1
  %length = alloca i64, align 8
  %valid = alloca i8, align 1
  %digits = alloca i64, align 8
  %at = alloca i64, align 8
  %hex = alloca ptr, align 8
  %done = alloca i8, align 1
  %index = alloca i64, align 8
  %narrow = alloca i8, align 1
  %negative = alloca i8, align 1
  %digits1 = alloca [24 x i8], align 1
  %count = alloca i64, align 8
  %digit = alloca i64, align 8
  %done2 = alloca i8, align 1
  %"control check 18.0" = alloca i8, align 1
  %"control value 18.0" = alloca i32, align 4
  %"control value 18.1" = alloca i8, align 1
  %"control value 18.2" = alloca i64, align 8
  %"control value 18.3" = alloca i8, align 1
  %"control value 18.4" = alloca ptr, align 8
  %"control value 18.5" = alloca ptr, align 8
  %"control value 18.6" = alloca ptr, align 8
  %"control value 18.7" = alloca ptr, align 8
  %"control value 18.8" = alloca i32, align 4
  %"control value 18.9" = alloca i8, align 1
  %"control value 18.10" = alloca i32, align 4
  %"control value 18.11" = alloca i8, align 1
  %"control value 18.12" = alloca ptr, align 8
  %"control value 18.13" = alloca i8, align 1
  %"control value 18.14" = alloca i8, align 1
  %"control value 18.15" = alloca i8, align 1
  %"control value 18.16" = alloca i32, align 4
  %"control value 18.17" = alloca i8, align 1
  %"control value 18.18" = alloca i8, align 1
  %"control value 18.19" = alloca i8, align 1
  %"control value 18.20" = alloca ptr, align 8
  %"control value 18.21" = alloca ptr, align 8
  %"control value 18.22" = alloca i32, align 4
  %"control value 18.23" = alloca i64, align 8
  %"control value 18.24" = alloca i64, align 8
  %"control value 18.25" = alloca ptr, align 8
  %"control value 18.26" = alloca i64, align 8
  %"control value 18.27" = alloca i64, align 8
  %"control value 18.28" = alloca i64, align 8
  %"control value 18.29" = alloca i64, align 8
  %"control value 18.30" = alloca i8, align 1
  %"control value 18.31" = alloca i8, align 1
  %"control value 18.32" = alloca ptr, align 8
  %"control value 18.33" = alloca i64, align 8
  %"control value 18.34" = alloca i64, align 8
  %"control value 18.35" = alloca i64, align 8
  %"control value 18.36" = alloca i64, align 8
  %"control value 18.37" = alloca i64, align 8
  %"control value 18.38" = alloca ptr, align 8
  %"control value 18.39" = alloca ptr, align 8
  %"control value 18.40" = alloca i64, align 8
  %"control value 18.41" = alloca i8, align 1
  %"control value 18.42" = alloca ptr, align 8
  %"control value 18.43" = alloca i64, align 8
  %"control value 18.44" = alloca i64, align 8
  %"control value 18.45" = alloca i32, align 4
  %"control value 18.46" = alloca i8, align 1
  %"control value 18.47" = alloca i8, align 1
  %"control value 18.48" = alloca ptr, align 8
  %"control value 18.49" = alloca i64, align 8
  %"control value 18.50" = alloca i64, align 8
  %"control value 18.51" = alloca ptr, align 8
  %"control value 18.52" = alloca i64, align 8
  %"control value 18.53" = alloca i8, align 1
  %"control value 18.54" = alloca i32, align 4
  %"control value 18.55" = alloca i8, align 1
  %"control value 18.56" = alloca ptr, align 8
  %"control value 18.57" = alloca i64, align 8
  %"control value 18.58" = alloca i8, align 1
  %"control value 18.59" = alloca i8, align 1
  %"control value 18.60" = alloca ptr, align 8
  %"control value 18.61" = alloca ptr, align 8
  %"control value 18.62" = alloca ptr, align 8
  %"control value 18.63" = alloca i64, align 8
  %"control value 18.64" = alloca i64, align 8
  %"control value 18.65" = alloca i64, align 8
  %"control value 18.66" = alloca i8, align 1
  %"control value 18.67" = alloca ptr, align 8
  %"control value 18.68" = alloca i64, align 8
  %"control value 18.69" = alloca i64, align 8
  %"control value 18.70" = alloca i64, align 8
  %"control value 18.71" = alloca i64, align 8
  %"control value 18.72" = alloca ptr, align 8
  %"control value 18.73" = alloca i64, align 8
  %"control value 18.74" = alloca i64, align 8
  %"control value 18.75" = alloca i64, align 8
  %"control value 18.76" = alloca ptr, align 8
  %"control value 18.77" = alloca i64, align 8
  %"control value 18.78" = alloca i8, align 1
  %"control value 18.79" = alloca ptr, align 8
  %"control value 18.80" = alloca i64, align 8
  %"control value 18.81" = alloca i64, align 8
  %"control value 18.82" = alloca ptr, align 8
  %"control value 18.83" = alloca i64, align 8
  %"control value 18.84" = alloca i64, align 8
  %"control value 18.85" = alloca i64, align 8
  %"control value 18.86" = alloca i8, align 1
  %"control value 18.87" = alloca i8, align 1
  %"control value 18.88" = alloca i64, align 8
  %"control value 18.89" = alloca i8, align 1
  %"control value 18.90" = alloca i8, align 1
  %"control value 18.91" = alloca ptr, align 8
  %"control value 18.92" = alloca i64, align 8
  %"control value 18.93" = alloca i64, align 8
  %"control value 18.94" = alloca i64, align 8
  %"control value 18.95" = alloca ptr, align 8
  %"control value 18.96" = alloca i64, align 8
  %"control value 18.97" = alloca i8, align 1
  %"control value 18.98" = alloca ptr, align 8
  %"control value 18.99" = alloca i64, align 8
  %"control value 18.100" = alloca i64, align 8
  %"control value 18.101" = alloca i64, align 8
  %"control value 18.102" = alloca ptr, align 8
  %"control value 18.103" = alloca ptr, align 8
  %"control value 18.104" = alloca i64, align 8
  %"control value 18.105" = alloca i64, align 8
  %"control value 18.106" = alloca i64, align 8
  %"control value 18.107" = alloca i64, align 8
  %"control value 18.108" = alloca i8, align 1
  %"control value 18.109" = alloca ptr, align 8
  %"control value 18.110" = alloca ptr, align 8
  %"control value 18.111" = alloca i64, align 8
  %"control value 18.112" = alloca i64, align 8
  store ptr %0, ptr %output, align 1
  store i64 %1, ptr %capacity, align 1
  store i32 %2, ptr %kind, align 1
  store i64 %3, ptr %value, align 1
  store i32 %4, ptr %pointer_bytes, align 1
  store i64 0, ptr %length, align 1
  %5 = load i32, ptr %kind, align 1
  store i32 %5, ptr %"control value 18.0", align 1
  %6 = load i32, ptr %"control value 18.0", align 1
  %7 = icmp eq i32 %6, 2
  %8 = zext i1 %7 to i8
  store i8 %8, ptr %"control value 18.1", align 1
  %9 = load i8, ptr %"control value 18.1", align 1
  %10 = icmp ne i8 %9, 0
  br i1 %10, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %11 = load i64, ptr %value, align 1
  store i64 %11, ptr %"control value 18.2", align 1
  %12 = load i64, ptr %"control value 18.2", align 1
  %13 = icmp ne i64 %12, 0
  %14 = zext i1 %13 to i8
  store i8 %14, ptr %"control value 18.3", align 1
  %15 = load i8, ptr %"control value 18.3", align 1
  %16 = icmp ne i8 %15, 0
  br i1 %16, label %if.body3, label %if.else4

if.else:                                          ; preds = %entry
  %17 = load i32, ptr %kind, align 1
  store i32 %17, ptr %"control value 18.8", align 1
  %18 = load i32, ptr %"control value 18.8", align 1
  %19 = icmp eq i32 %18, 3
  %20 = zext i1 %19 to i8
  store i8 %20, ptr %"control value 18.9", align 1
  %21 = load i8, ptr %"control value 18.9", align 1
  %22 = icmp ne i8 %21, 0
  br i1 %22, label %if.body6, label %if.else7

if.end:                                           ; preds = %if.end8, %if.end5
  %23 = load i64, ptr %capacity, align 1
  store i64 %23, ptr %"control value 18.106", align 1
  %24 = load i64, ptr %length, align 1
  store i64 %24, ptr %"control value 18.107", align 1
  %25 = load i64, ptr %"control value 18.106", align 1
  %26 = load i64, ptr %"control value 18.107", align 1
  %27 = icmp uge i64 %25, %26
  %28 = zext i1 %27 to i8
  store i8 %28, ptr %"control value 18.108", align 1
  %29 = load i8, ptr %"control value 18.108", align 1
  %30 = icmp ne i8 %29, 0
  br i1 %30, label %if.body51, label %if.else52

if.body3:                                         ; preds = %if.body
  %31 = getelementptr i8, ptr %buffer, i64 0
  store ptr %31, ptr %"control value 18.4", align 1
  %32 = load ptr, ptr %"control value 18.4", align 1
  call void @llvm.memmove.p0.p0.i64(ptr align 1 %32, ptr align 1 @tower.string, i64 5, i1 false)
  store ptr %length, ptr %"control value 18.5", align 1
  %33 = load ptr, ptr %"control value 18.5", align 1
  store i64 5, ptr %33, align 1
  br label %if.end5

if.else4:                                         ; preds = %if.body
  %34 = getelementptr i8, ptr %buffer, i64 0
  store ptr %34, ptr %"control value 18.6", align 1
  %35 = load ptr, ptr %"control value 18.6", align 1
  call void @llvm.memmove.p0.p0.i64(ptr align 1 %35, ptr align 1 @tower.string.1, i64 6, i1 false)
  store ptr %length, ptr %"control value 18.7", align 1
  %36 = load ptr, ptr %"control value 18.7", align 1
  store i64 6, ptr %36, align 1
  br label %if.end5

if.end5:                                          ; preds = %if.else4, %if.body3
  br label %if.end

if.body6:                                         ; preds = %if.else
  %37 = load i32, ptr %pointer_bytes, align 1
  store i32 %37, ptr %"control value 18.10", align 1
  %38 = load i32, ptr %"control value 18.10", align 1
  %39 = icmp eq i32 %38, 4
  %40 = zext i1 %39 to i8
  store i8 %40, ptr %"control value 18.11", align 1
  %41 = load i8, ptr %"control value 18.11", align 1
  store i8 %41, ptr %valid, align 1
  store ptr %valid, ptr %"control value 18.12", align 1
  %42 = load ptr, ptr %"control value 18.12", align 1
  %43 = load i8, ptr %42, align 1
  store i8 %43, ptr %"control value 18.13", align 1
  %44 = load i8, ptr %"control value 18.13", align 1
  store i8 %44, ptr %"control value 18.14", align 1
  %45 = load i8, ptr %"control value 18.14", align 1
  store i8 %45, ptr %"control value 18.15", align 1
  %46 = load i8, ptr %"control value 18.14", align 1
  %47 = icmp ne i8 %46, 0
  br i1 %47, label %if.body9, label %if.else10

if.else7:                                         ; preds = %if.else
  %48 = load i32, ptr %kind, align 1
  store i32 %48, ptr %"control value 18.45", align 1
  %49 = load i32, ptr %"control value 18.45", align 1
  %50 = icmp eq i32 %49, 0
  %51 = zext i1 %50 to i8
  store i8 %51, ptr %"control value 18.46", align 1
  %52 = load i8, ptr %"control value 18.46", align 1
  store i8 %52, ptr %narrow, align 1
  store i8 0, ptr %negative, align 1
  %53 = load i8, ptr %narrow, align 1
  store i8 %53, ptr %"control value 18.47", align 1
  %54 = load i8, ptr %"control value 18.47", align 1
  %55 = icmp ne i8 %54, 0
  br i1 %55, label %if.body23, label %if.else24

if.end8:                                          ; preds = %loop.end47, %loop.end
  %56 = load i64, ptr %length, align 1
  store i64 %56, ptr %"control value 18.101", align 1
  %57 = load i64, ptr %"control value 18.101", align 1
  %58 = mul i64 %57, 1
  %59 = getelementptr i8, ptr %buffer, i64 %58
  store ptr %59, ptr %"control value 18.102", align 1
  %60 = load ptr, ptr %"control value 18.102", align 1
  store i8 10, ptr %60, align 1
  store ptr %length, ptr %"control value 18.103", align 1
  %61 = load ptr, ptr %"control value 18.103", align 1
  %62 = load i64, ptr %61, align 1
  store i64 %62, ptr %"control value 18.104", align 1
  %63 = load i64, ptr %"control value 18.104", align 1
  %64 = add i64 %63, 1
  store i64 %64, ptr %"control value 18.105", align 1
  %65 = load ptr, ptr %"control value 18.103", align 1
  %66 = load i64, ptr %"control value 18.105", align 1
  store i64 %66, ptr %65, align 1
  br label %if.end

if.body9:                                         ; preds = %if.body6
  br label %if.end11

if.else10:                                        ; preds = %if.body6
  %67 = load i32, ptr %pointer_bytes, align 1
  store i32 %67, ptr %"control value 18.16", align 1
  %68 = load i32, ptr %"control value 18.16", align 1
  %69 = icmp eq i32 %68, 8
  %70 = zext i1 %69 to i8
  store i8 %70, ptr %"control value 18.17", align 1
  %71 = load i8, ptr %"control value 18.17", align 1
  store i8 %71, ptr %"control value 18.15", align 1
  %72 = load ptr, ptr %"control value 18.12", align 1
  %73 = load i8, ptr %"control value 18.17", align 1
  store i8 %73, ptr %72, align 1
  br label %if.end11

if.end11:                                         ; preds = %if.else10, %if.body9
  %74 = load i8, ptr %valid, align 1
  store i8 %74, ptr %"control value 18.18", align 1
  %75 = load i8, ptr %"control value 18.18", align 1
  %76 = icmp eq i8 0, %75
  %77 = zext i1 %76 to i8
  store i8 %77, ptr %"control value 18.19", align 1
  %78 = load i8, ptr %"control value 18.19", align 1
  %79 = icmp ne i8 %78, 0
  br i1 %79, label %if.body12, label %if.else13

if.body12:                                        ; preds = %if.end11
  ret i64 0

if.else13:                                        ; preds = %if.end11
  br label %if.end14

if.end14:                                         ; preds = %if.else13
  %80 = getelementptr i8, ptr %buffer, i64 0
  store ptr %80, ptr %"control value 18.20", align 1
  %81 = load ptr, ptr %"control value 18.20", align 1
  store i8 48, ptr %81, align 1
  %82 = getelementptr i8, ptr %buffer, i64 1
  store ptr %82, ptr %"control value 18.21", align 1
  %83 = load ptr, ptr %"control value 18.21", align 1
  store i8 120, ptr %83, align 1
  %84 = load i32, ptr %pointer_bytes, align 1
  store i32 %84, ptr %"control value 18.22", align 1
  %85 = load i32, ptr %"control value 18.22", align 1
  %86 = zext i32 %85 to i64
  %87 = icmp ule i64 %86, -1
  %88 = and i1 true, %87
  br i1 %88, label %valid15, label %error

valid15:                                          ; preds = %if.end14
  %89 = zext i32 %85 to i64
  store i64 %89, ptr %"control value 18.23", align 1
  %90 = load i64, ptr %"control value 18.23", align 1
  %91 = mul i64 %90, 2
  store i64 %91, ptr %"control value 18.24", align 1
  %92 = load i64, ptr %"control value 18.24", align 1
  store i64 %92, ptr %digits, align 1
  store ptr %length, ptr %"control value 18.25", align 1
  %93 = load i64, ptr %digits, align 1
  store i64 %93, ptr %"control value 18.26", align 1
  %94 = load i64, ptr %"control value 18.26", align 1
  %95 = add i64 %94, 2
  store i64 %95, ptr %"control value 18.27", align 1
  %96 = load ptr, ptr %"control value 18.25", align 1
  %97 = load i64, ptr %"control value 18.27", align 1
  store i64 %97, ptr %96, align 1
  %98 = load i64, ptr %length, align 1
  store i64 %98, ptr %"control value 18.28", align 1
  %99 = load i64, ptr %"control value 18.28", align 1
  store i64 %99, ptr %at, align 1
  store ptr @tower.string.2, ptr %hex, align 1
  br label %loop

error:                                            ; preds = %if.end14
  call void @tower_trap(ptr @4, i64 20546)
  unreachable

loop:                                             ; preds = %valid21, %valid15
  %100 = load i64, ptr %at, align 1
  store i64 %100, ptr %"control value 18.29", align 1
  %101 = load i64, ptr %"control value 18.29", align 1
  %102 = icmp eq i64 %101, 2
  %103 = zext i1 %102 to i8
  store i8 %103, ptr %"control value 18.30", align 1
  %104 = load i8, ptr %"control value 18.30", align 1
  store i8 %104, ptr %done, align 1
  %105 = load i8, ptr %done, align 1
  store i8 %105, ptr %"control value 18.31", align 1
  %106 = load i8, ptr %"control value 18.31", align 1
  %107 = icmp ne i8 %106, 0
  br i1 %107, label %if.body16, label %if.else17

loop.end:                                         ; preds = %if.body16
  br label %if.end8

if.body16:                                        ; preds = %loop
  br label %loop.end

if.else17:                                        ; preds = %loop
  br label %if.end18

if.end18:                                         ; preds = %if.else17
  store ptr %at, ptr %"control value 18.32", align 1
  %108 = load ptr, ptr %"control value 18.32", align 1
  %109 = load i64, ptr %108, align 1
  store i64 %109, ptr %"control value 18.33", align 1
  %110 = load i64, ptr %"control value 18.33", align 1
  %111 = sub i64 %110, 1
  store i64 %111, ptr %"control value 18.34", align 1
  %112 = load ptr, ptr %"control value 18.32", align 1
  %113 = load i64, ptr %"control value 18.34", align 1
  store i64 %113, ptr %112, align 1
  %114 = load i64, ptr %value, align 1
  store i64 %114, ptr %"control value 18.35", align 1
  %115 = load i64, ptr %"control value 18.35", align 1
  br i1 true, label %valid19, label %error20

valid19:                                          ; preds = %if.end18
  %116 = urem i64 %115, 16
  store i64 %116, ptr %"control value 18.36", align 1
  %117 = load i64, ptr %"control value 18.36", align 1
  store i64 %117, ptr %index, align 1
  %118 = load i64, ptr %at, align 1
  store i64 %118, ptr %"control value 18.37", align 1
  %119 = load i64, ptr %"control value 18.37", align 1
  %120 = mul i64 %119, 1
  %121 = getelementptr i8, ptr %buffer, i64 %120
  store ptr %121, ptr %"control value 18.38", align 1
  %122 = load ptr, ptr %hex, align 1
  store ptr %122, ptr %"control value 18.39", align 1
  %123 = load i64, ptr %index, align 1
  store i64 %123, ptr %"control value 18.40", align 1
  %124 = load ptr, ptr %"control value 18.39", align 1
  %125 = load i64, ptr %"control value 18.40", align 1
  %126 = mul i64 %125, 1
  %127 = getelementptr i8, ptr %124, i64 %126
  %128 = load i8, ptr %127, align 1
  store i8 %128, ptr %"control value 18.41", align 1
  %129 = load ptr, ptr %"control value 18.38", align 1
  %130 = load i8, ptr %"control value 18.41", align 1
  store i8 %130, ptr %129, align 1
  store ptr %value, ptr %"control value 18.42", align 1
  %131 = load i64, ptr %value, align 1
  store i64 %131, ptr %"control value 18.43", align 1
  %132 = load i64, ptr %"control value 18.43", align 1
  br i1 true, label %valid21, label %error22

error20:                                          ; preds = %if.end18
  call void @tower_trap(ptr @5, i64 20546)
  unreachable

valid21:                                          ; preds = %valid19
  %133 = udiv i64 %132, 16
  store i64 %133, ptr %"control value 18.44", align 1
  %134 = load ptr, ptr %"control value 18.42", align 1
  %135 = load i64, ptr %"control value 18.44", align 1
  store i64 %135, ptr %134, align 1
  br label %loop

error22:                                          ; preds = %valid19
  call void @tower_trap(ptr @6, i64 20546)
  unreachable

if.body23:                                        ; preds = %if.else7
  store ptr %value, ptr %"control value 18.48", align 1
  %136 = load i64, ptr %value, align 1
  store i64 %136, ptr %"control value 18.49", align 1
  %137 = load i64, ptr %"control value 18.49", align 1
  %138 = and i64 %137, 4294967295
  store i64 %138, ptr %"control value 18.50", align 1
  %139 = load ptr, ptr %"control value 18.48", align 1
  %140 = load i64, ptr %"control value 18.50", align 1
  store i64 %140, ptr %139, align 1
  store ptr %negative, ptr %"control value 18.51", align 1
  %141 = load i64, ptr %value, align 1
  store i64 %141, ptr %"control value 18.52", align 1
  %142 = load i64, ptr %"control value 18.52", align 1
  %143 = icmp uge i64 %142, 2147483648
  %144 = zext i1 %143 to i8
  store i8 %144, ptr %"control value 18.53", align 1
  %145 = load ptr, ptr %"control value 18.51", align 1
  %146 = load i8, ptr %"control value 18.53", align 1
  store i8 %146, ptr %145, align 1
  br label %if.end25

if.else24:                                        ; preds = %if.else7
  %147 = load i32, ptr %kind, align 1
  store i32 %147, ptr %"control value 18.54", align 1
  %148 = load i32, ptr %"control value 18.54", align 1
  %149 = icmp eq i32 %148, 6
  %150 = zext i1 %149 to i8
  store i8 %150, ptr %"control value 18.55", align 1
  %151 = load i8, ptr %"control value 18.55", align 1
  %152 = icmp ne i8 %151, 0
  br i1 %152, label %if.body26, label %if.else27

if.end25:                                         ; preds = %if.end28, %if.body23
  %153 = load i8, ptr %negative, align 1
  store i8 %153, ptr %"control value 18.59", align 1
  %154 = load i8, ptr %"control value 18.59", align 1
  %155 = icmp ne i8 %154, 0
  br i1 %155, label %if.body29, label %if.else30

if.body26:                                        ; preds = %if.else24
  store ptr %negative, ptr %"control value 18.56", align 1
  %156 = load i64, ptr %value, align 1
  store i64 %156, ptr %"control value 18.57", align 1
  %157 = load i64, ptr %"control value 18.57", align 1
  %158 = icmp uge i64 %157, -9223372036854775808
  %159 = zext i1 %158 to i8
  store i8 %159, ptr %"control value 18.58", align 1
  %160 = load ptr, ptr %"control value 18.56", align 1
  %161 = load i8, ptr %"control value 18.58", align 1
  store i8 %161, ptr %160, align 1
  br label %if.end28

if.else27:                                        ; preds = %if.else24
  br label %if.end28

if.end28:                                         ; preds = %if.else27, %if.body26
  br label %if.end25

if.body29:                                        ; preds = %if.end25
  %162 = getelementptr i8, ptr %buffer, i64 0
  store ptr %162, ptr %"control value 18.60", align 1
  %163 = load ptr, ptr %"control value 18.60", align 1
  store i8 45, ptr %163, align 1
  store ptr %length, ptr %"control value 18.61", align 1
  %164 = load ptr, ptr %"control value 18.61", align 1
  store i64 1, ptr %164, align 1
  store ptr %value, ptr %"control value 18.62", align 1
  store i64 0, ptr %"control value 18.63", align 1
  %165 = load i64, ptr %value, align 1
  store i64 %165, ptr %"control value 18.64", align 1
  %166 = load i64, ptr %"control value 18.63", align 1
  %167 = load i64, ptr %"control value 18.64", align 1
  %168 = sub i64 %166, %167
  store i64 %168, ptr %"control value 18.65", align 1
  %169 = load ptr, ptr %"control value 18.62", align 1
  %170 = load i64, ptr %"control value 18.65", align 1
  store i64 %170, ptr %169, align 1
  %171 = load i8, ptr %narrow, align 1
  store i8 %171, ptr %"control value 18.66", align 1
  %172 = load i8, ptr %"control value 18.66", align 1
  %173 = icmp ne i8 %172, 0
  br i1 %173, label %if.body32, label %if.else33

if.else30:                                        ; preds = %if.end25
  br label %if.end31

if.end31:                                         ; preds = %if.end34, %if.else30
  store i64 0, ptr %count, align 1
  br label %loop35

if.body32:                                        ; preds = %if.body29
  store ptr %value, ptr %"control value 18.67", align 1
  %174 = load i64, ptr %value, align 1
  store i64 %174, ptr %"control value 18.68", align 1
  %175 = load i64, ptr %"control value 18.68", align 1
  %176 = and i64 %175, 4294967295
  store i64 %176, ptr %"control value 18.69", align 1
  %177 = load ptr, ptr %"control value 18.67", align 1
  %178 = load i64, ptr %"control value 18.69", align 1
  store i64 %178, ptr %177, align 1
  br label %if.end34

if.else33:                                        ; preds = %if.body29
  br label %if.end34

if.end34:                                         ; preds = %if.else33, %if.body32
  br label %if.end31

loop35:                                           ; preds = %if.end45, %if.end31
  %179 = load i64, ptr %value, align 1
  store i64 %179, ptr %"control value 18.70", align 1
  %180 = load i64, ptr %"control value 18.70", align 1
  br i1 true, label %valid37, label %error38

loop.end36:                                       ; preds = %if.body43
  br label %loop46

valid37:                                          ; preds = %loop35
  %181 = urem i64 %180, 10
  store i64 %181, ptr %"control value 18.71", align 1
  %182 = load i64, ptr %"control value 18.71", align 1
  store i64 %182, ptr %digit, align 1
  store ptr %digit, ptr %"control value 18.72", align 1
  %183 = load i64, ptr %digit, align 1
  store i64 %183, ptr %"control value 18.73", align 1
  %184 = load i64, ptr %"control value 18.73", align 1
  %185 = add i64 %184, 48
  store i64 %185, ptr %"control value 18.74", align 1
  %186 = load ptr, ptr %"control value 18.72", align 1
  %187 = load i64, ptr %"control value 18.74", align 1
  store i64 %187, ptr %186, align 1
  %188 = load i64, ptr %count, align 1
  store i64 %188, ptr %"control value 18.75", align 1
  %189 = load i64, ptr %"control value 18.75", align 1
  %190 = mul i64 %189, 1
  %191 = getelementptr i8, ptr %digits1, i64 %190
  store ptr %191, ptr %"control value 18.76", align 1
  %192 = load i64, ptr %digit, align 1
  store i64 %192, ptr %"control value 18.77", align 1
  %193 = load i64, ptr %"control value 18.77", align 1
  %194 = icmp ule i64 %193, 255
  %195 = and i1 true, %194
  br i1 %195, label %valid39, label %error40

error38:                                          ; preds = %loop35
  call void @tower_trap(ptr @7, i64 20546)
  unreachable

valid39:                                          ; preds = %valid37
  %196 = trunc i64 %193 to i8
  store i8 %196, ptr %"control value 18.78", align 1
  %197 = load ptr, ptr %"control value 18.76", align 1
  %198 = load i8, ptr %"control value 18.78", align 1
  store i8 %198, ptr %197, align 1
  store ptr %count, ptr %"control value 18.79", align 1
  %199 = load ptr, ptr %"control value 18.79", align 1
  %200 = load i64, ptr %199, align 1
  store i64 %200, ptr %"control value 18.80", align 1
  %201 = load i64, ptr %"control value 18.80", align 1
  %202 = add i64 %201, 1
  store i64 %202, ptr %"control value 18.81", align 1
  %203 = load ptr, ptr %"control value 18.79", align 1
  %204 = load i64, ptr %"control value 18.81", align 1
  store i64 %204, ptr %203, align 1
  store ptr %value, ptr %"control value 18.82", align 1
  %205 = load i64, ptr %value, align 1
  store i64 %205, ptr %"control value 18.83", align 1
  %206 = load i64, ptr %"control value 18.83", align 1
  br i1 true, label %valid41, label %error42

error40:                                          ; preds = %valid37
  call void @tower_trap(ptr @8, i64 20546)
  unreachable

valid41:                                          ; preds = %valid39
  %207 = udiv i64 %206, 10
  store i64 %207, ptr %"control value 18.84", align 1
  %208 = load ptr, ptr %"control value 18.82", align 1
  %209 = load i64, ptr %"control value 18.84", align 1
  store i64 %209, ptr %208, align 1
  %210 = load i64, ptr %value, align 1
  store i64 %210, ptr %"control value 18.85", align 1
  %211 = load i64, ptr %"control value 18.85", align 1
  %212 = icmp eq i64 %211, 0
  %213 = zext i1 %212 to i8
  store i8 %213, ptr %"control value 18.86", align 1
  %214 = load i8, ptr %"control value 18.86", align 1
  store i8 %214, ptr %done2, align 1
  %215 = load i8, ptr %done2, align 1
  store i8 %215, ptr %"control value 18.87", align 1
  %216 = load i8, ptr %"control value 18.87", align 1
  %217 = icmp ne i8 %216, 0
  br i1 %217, label %if.body43, label %if.else44

error42:                                          ; preds = %valid39
  call void @tower_trap(ptr @9, i64 20546)
  unreachable

if.body43:                                        ; preds = %valid41
  br label %loop.end36

if.else44:                                        ; preds = %valid41
  br label %if.end45

if.end45:                                         ; preds = %if.else44
  br label %loop35

loop46:                                           ; preds = %if.end50, %loop.end36
  %218 = load i64, ptr %count, align 1
  store i64 %218, ptr %"control value 18.88", align 1
  %219 = load i64, ptr %"control value 18.88", align 1
  %220 = icmp ne i64 %219, 0
  %221 = zext i1 %220 to i8
  store i8 %221, ptr %"control value 18.89", align 1
  %222 = load i8, ptr %"control value 18.89", align 1
  store i8 %222, ptr %"control check 18.0", align 1
  %223 = load i8, ptr %"control check 18.0", align 1
  store i8 %223, ptr %"control value 18.90", align 1
  %224 = load i8, ptr %"control value 18.90", align 1
  %225 = icmp ne i8 %224, 0
  br i1 %225, label %if.body48, label %if.else49

loop.end47:                                       ; preds = %if.else49
  br label %if.end8

if.body48:                                        ; preds = %loop46
  store ptr %count, ptr %"control value 18.91", align 1
  %226 = load ptr, ptr %"control value 18.91", align 1
  %227 = load i64, ptr %226, align 1
  store i64 %227, ptr %"control value 18.92", align 1
  %228 = load i64, ptr %"control value 18.92", align 1
  %229 = sub i64 %228, 1
  store i64 %229, ptr %"control value 18.93", align 1
  %230 = load ptr, ptr %"control value 18.91", align 1
  %231 = load i64, ptr %"control value 18.93", align 1
  store i64 %231, ptr %230, align 1
  %232 = load i64, ptr %length, align 1
  store i64 %232, ptr %"control value 18.94", align 1
  %233 = load i64, ptr %"control value 18.94", align 1
  %234 = mul i64 %233, 1
  %235 = getelementptr i8, ptr %buffer, i64 %234
  store ptr %235, ptr %"control value 18.95", align 1
  %236 = load i64, ptr %count, align 1
  store i64 %236, ptr %"control value 18.96", align 1
  %237 = load i64, ptr %"control value 18.96", align 1
  %238 = mul i64 %237, 1
  %239 = getelementptr i8, ptr %digits1, i64 %238
  %240 = load i8, ptr %239, align 1
  store i8 %240, ptr %"control value 18.97", align 1
  %241 = load ptr, ptr %"control value 18.95", align 1
  %242 = load i8, ptr %"control value 18.97", align 1
  store i8 %242, ptr %241, align 1
  br label %if.end50

if.else49:                                        ; preds = %loop46
  br label %loop.end47

if.end50:                                         ; preds = %if.body48
  store ptr %length, ptr %"control value 18.98", align 1
  %243 = load ptr, ptr %"control value 18.98", align 1
  %244 = load i64, ptr %243, align 1
  store i64 %244, ptr %"control value 18.99", align 1
  %245 = load i64, ptr %"control value 18.99", align 1
  %246 = add i64 %245, 1
  store i64 %246, ptr %"control value 18.100", align 1
  %247 = load ptr, ptr %"control value 18.98", align 1
  %248 = load i64, ptr %"control value 18.100", align 1
  store i64 %248, ptr %247, align 1
  br label %loop46

if.body51:                                        ; preds = %if.end
  %249 = load ptr, ptr %output, align 1
  store ptr %249, ptr %"control value 18.109", align 1
  %250 = getelementptr i8, ptr %buffer, i64 0
  store ptr %250, ptr %"control value 18.110", align 1
  %251 = load i64, ptr %length, align 1
  store i64 %251, ptr %"control value 18.111", align 1
  %252 = load ptr, ptr %"control value 18.109", align 1
  %253 = load ptr, ptr %"control value 18.110", align 1
  %254 = load i64, ptr %"control value 18.111", align 1
  call void @llvm.memmove.p0.p0.i64(ptr align 1 %252, ptr align 1 %253, i64 %254, i1 false)
  %255 = load i64, ptr %length, align 1
  store i64 %255, ptr %"control value 18.112", align 1
  %256 = load i64, ptr %"control value 18.112", align 1
  ret i64 %256

if.else52:                                        ; preds = %if.end
  br label %if.end53

if.end53:                                         ; preds = %if.else52
  ret i64 0
}

define zeroext i8 @runtime_write_all(i32 %0, ptr %1, i64 %2) {
entry:
  %stream = alloca i32, align 4
  %data = alloca ptr, align 8
  %length = alloca i64, align 8
  %valid = alloca i8, align 1
  %at = alloca i64, align 8
  %remaining = alloca i64, align 8
  %written = alloca i64, align 8
  %count = alloca i64, align 8
  %"control value 19.0" = alloca i32, align 4
  %"control value 19.1" = alloca i8, align 1
  %"control value 19.2" = alloca ptr, align 8
  %"control value 19.3" = alloca i8, align 1
  %"control value 19.4" = alloca i8, align 1
  %"control value 19.5" = alloca i8, align 1
  %"control value 19.6" = alloca i32, align 4
  %"control value 19.7" = alloca i8, align 1
  %"control value 19.8" = alloca i8, align 1
  %"control value 19.9" = alloca i8, align 1
  %"control value 19.10" = alloca i64, align 8
  %"control value 19.11" = alloca i64, align 8
  %"control value 19.12" = alloca i8, align 1
  %"control value 19.13" = alloca i64, align 8
  %"control value 19.14" = alloca i64, align 8
  %"control value 19.15" = alloca i64, align 8
  %"control value 19.16" = alloca i32, align 4
  %"control value 19.17" = alloca ptr, align 8
  %"control value 19.18" = alloca i64, align 8
  %"control value 19.19" = alloca ptr, align 8
  %"control value 19.20" = alloca i64, align 8
  %"control value 19.21" = alloca i64, align 8
  %"control value 19.22" = alloca i64, align 8
  %"control value 19.23" = alloca i8, align 1
  %"control value 19.24" = alloca i64, align 8
  %"control value 19.25" = alloca i64, align 8
  %"control value 19.26" = alloca i64, align 8
  %"control value 19.27" = alloca i64, align 8
  %"control value 19.28" = alloca i64, align 8
  %"control value 19.29" = alloca i8, align 1
  %"control value 19.30" = alloca ptr, align 8
  %"control value 19.31" = alloca i64, align 8
  %"control value 19.32" = alloca i64, align 8
  %"control value 19.33" = alloca i64, align 8
  %"control value 19.34" = alloca i64, align 8
  store i32 %0, ptr %stream, align 1
  store ptr %1, ptr %data, align 1
  store i64 %2, ptr %length, align 1
  %3 = load i32, ptr %stream, align 1
  store i32 %3, ptr %"control value 19.0", align 1
  %4 = load i32, ptr %"control value 19.0", align 1
  %5 = icmp eq i32 %4, 1
  %6 = zext i1 %5 to i8
  store i8 %6, ptr %"control value 19.1", align 1
  %7 = load i8, ptr %"control value 19.1", align 1
  store i8 %7, ptr %valid, align 1
  store ptr %valid, ptr %"control value 19.2", align 1
  %8 = load ptr, ptr %"control value 19.2", align 1
  %9 = load i8, ptr %8, align 1
  store i8 %9, ptr %"control value 19.3", align 1
  %10 = load i8, ptr %"control value 19.3", align 1
  store i8 %10, ptr %"control value 19.4", align 1
  %11 = load i8, ptr %"control value 19.4", align 1
  store i8 %11, ptr %"control value 19.5", align 1
  %12 = load i8, ptr %"control value 19.4", align 1
  %13 = icmp ne i8 %12, 0
  br i1 %13, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  br label %if.end

if.else:                                          ; preds = %entry
  %14 = load i32, ptr %stream, align 1
  store i32 %14, ptr %"control value 19.6", align 1
  %15 = load i32, ptr %"control value 19.6", align 1
  %16 = icmp eq i32 %15, 2
  %17 = zext i1 %16 to i8
  store i8 %17, ptr %"control value 19.7", align 1
  %18 = load i8, ptr %"control value 19.7", align 1
  store i8 %18, ptr %"control value 19.5", align 1
  %19 = load ptr, ptr %"control value 19.2", align 1
  %20 = load i8, ptr %"control value 19.7", align 1
  store i8 %20, ptr %19, align 1
  br label %if.end

if.end:                                           ; preds = %if.else, %if.body
  %21 = load i8, ptr %valid, align 1
  store i8 %21, ptr %"control value 19.8", align 1
  %22 = load i8, ptr %"control value 19.8", align 1
  %23 = icmp eq i8 0, %22
  %24 = zext i1 %23 to i8
  store i8 %24, ptr %"control value 19.9", align 1
  %25 = load i8, ptr %"control value 19.9", align 1
  %26 = icmp ne i8 %25, 0
  br i1 %26, label %if.body1, label %if.else2

if.body1:                                         ; preds = %if.end
  ret i8 0

if.else2:                                         ; preds = %if.end
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  store i64 0, ptr %at, align 1
  br label %loop

loop:                                             ; preds = %valid16, %if.end3
  %27 = load i64, ptr %at, align 1
  store i64 %27, ptr %"control value 19.10", align 1
  %28 = load i64, ptr %length, align 1
  store i64 %28, ptr %"control value 19.11", align 1
  %29 = load i64, ptr %"control value 19.10", align 1
  %30 = load i64, ptr %"control value 19.11", align 1
  %31 = icmp eq i64 %29, %30
  %32 = zext i1 %31 to i8
  store i8 %32, ptr %"control value 19.12", align 1
  %33 = load i8, ptr %"control value 19.12", align 1
  %34 = icmp ne i8 %33, 0
  br i1 %34, label %if.body4, label %if.else5

loop.end:                                         ; No predecessors!
  unreachable

if.body4:                                         ; preds = %loop
  ret i8 1

if.else5:                                         ; preds = %loop
  br label %if.end6

if.end6:                                          ; preds = %if.else5
  %35 = load i64, ptr %length, align 1
  store i64 %35, ptr %"control value 19.13", align 1
  %36 = load i64, ptr %at, align 1
  store i64 %36, ptr %"control value 19.14", align 1
  %37 = load i64, ptr %"control value 19.13", align 1
  %38 = load i64, ptr %"control value 19.14", align 1
  %39 = sub i64 %37, %38
  store i64 %39, ptr %"control value 19.15", align 1
  %40 = load i64, ptr %"control value 19.15", align 1
  store i64 %40, ptr %remaining, align 1
  %41 = load i32, ptr %stream, align 1
  store i32 %41, ptr %"control value 19.16", align 1
  %42 = load ptr, ptr %data, align 1
  store ptr %42, ptr %"control value 19.17", align 1
  %43 = load i64, ptr %at, align 1
  store i64 %43, ptr %"control value 19.18", align 1
  %44 = load ptr, ptr %"control value 19.17", align 1
  %45 = load i64, ptr %"control value 19.18", align 1
  %46 = mul i64 %45, 1
  %47 = getelementptr i8, ptr %44, i64 %46
  store ptr %47, ptr %"control value 19.19", align 1
  %48 = load i64, ptr %remaining, align 1
  store i64 %48, ptr %"control value 19.20", align 1
  %49 = load i32, ptr %"control value 19.16", align 1
  %50 = load ptr, ptr %"control value 19.19", align 1
  %51 = load i64, ptr %"control value 19.20", align 1
  %52 = call i64 @platform_write(i32 %49, ptr %50, i64 %51)
  store i64 %52, ptr %"control value 19.21", align 1
  %53 = load i64, ptr %"control value 19.21", align 1
  store i64 %53, ptr %written, align 1
  %54 = load i64, ptr %written, align 1
  store i64 %54, ptr %"control value 19.22", align 1
  %55 = load i64, ptr %"control value 19.22", align 1
  %56 = icmp sle i64 %55, 0
  %57 = zext i1 %56 to i8
  store i8 %57, ptr %"control value 19.23", align 1
  %58 = load i8, ptr %"control value 19.23", align 1
  %59 = icmp ne i8 %58, 0
  br i1 %59, label %if.body7, label %if.else8

if.body7:                                         ; preds = %if.end6
  ret i8 0

if.else8:                                         ; preds = %if.end6
  br label %if.end9

if.end9:                                          ; preds = %if.else8
  %60 = load i64, ptr %written, align 1
  store i64 %60, ptr %"control value 19.24", align 1
  %61 = load i64, ptr %"control value 19.24", align 1
  %62 = icmp sge i64 %61, 0
  %63 = icmp ule i64 %61, -1
  %64 = and i1 %62, %63
  br i1 %64, label %valid10, label %error

valid10:                                          ; preds = %if.end9
  store i64 %61, ptr %"control value 19.25", align 1
  %65 = load i64, ptr %"control value 19.25", align 1
  store i64 %65, ptr %count, align 1
  %66 = load i64, ptr %count, align 1
  store i64 %66, ptr %"control value 19.26", align 1
  %67 = load i64, ptr %remaining, align 1
  store i64 %67, ptr %"control value 19.27", align 1
  %68 = load i64, ptr %"control value 19.27", align 1
  %69 = icmp ule i64 %68, -1
  %70 = and i1 true, %69
  br i1 %70, label %valid11, label %error12

error:                                            ; preds = %if.end9
  call void @tower_trap(ptr @10, i64 20546)
  unreachable

valid11:                                          ; preds = %valid10
  store i64 %68, ptr %"control value 19.28", align 1
  %71 = load i64, ptr %"control value 19.26", align 1
  %72 = load i64, ptr %"control value 19.28", align 1
  %73 = icmp ugt i64 %71, %72
  %74 = zext i1 %73 to i8
  store i8 %74, ptr %"control value 19.29", align 1
  %75 = load i8, ptr %"control value 19.29", align 1
  %76 = icmp ne i8 %75, 0
  br i1 %76, label %if.body13, label %if.else14

error12:                                          ; preds = %valid10
  call void @tower_trap(ptr @11, i64 20546)
  unreachable

if.body13:                                        ; preds = %valid11
  ret i8 0

if.else14:                                        ; preds = %valid11
  br label %if.end15

if.end15:                                         ; preds = %if.else14
  store ptr %at, ptr %"control value 19.30", align 1
  %77 = load i64, ptr %at, align 1
  store i64 %77, ptr %"control value 19.31", align 1
  %78 = load i64, ptr %count, align 1
  store i64 %78, ptr %"control value 19.32", align 1
  %79 = load i64, ptr %"control value 19.32", align 1
  %80 = icmp ule i64 %79, -1
  %81 = and i1 true, %80
  br i1 %81, label %valid16, label %error17

valid16:                                          ; preds = %if.end15
  store i64 %79, ptr %"control value 19.33", align 1
  %82 = load i64, ptr %"control value 19.31", align 1
  %83 = load i64, ptr %"control value 19.33", align 1
  %84 = add i64 %82, %83
  store i64 %84, ptr %"control value 19.34", align 1
  %85 = load ptr, ptr %"control value 19.30", align 1
  %86 = load i64, ptr %"control value 19.34", align 1
  store i64 %86, ptr %85, align 1
  br label %loop

error17:                                          ; preds = %if.end15
  call void @tower_trap(ptr @12, i64 20546)
  unreachable
}

define zeroext i8 @runtime_print_value(i32 %0, i64 %1, i32 %2) {
entry:
  %kind = alloca i32, align 4
  %value = alloca i64, align 8
  %pointer_bytes = alloca i32, align 4
  %buffer = alloca [80 x i8], align 1
  %length = alloca i64, align 8
  %"control value 20.0" = alloca ptr, align 8
  %"control value 20.1" = alloca i32, align 4
  %"control value 20.2" = alloca i64, align 8
  %"control value 20.3" = alloca i32, align 4
  %"control value 20.4" = alloca i64, align 8
  %"control value 20.5" = alloca i64, align 8
  %"control value 20.6" = alloca i8, align 1
  %"control value 20.7" = alloca ptr, align 8
  %"control value 20.8" = alloca i64, align 8
  %"control value 20.9" = alloca i8, align 1
  store i32 %0, ptr %kind, align 1
  store i64 %1, ptr %value, align 1
  store i32 %2, ptr %pointer_bytes, align 1
  %3 = getelementptr i8, ptr %buffer, i64 0
  store ptr %3, ptr %"control value 20.0", align 1
  %4 = load i32, ptr %kind, align 1
  store i32 %4, ptr %"control value 20.1", align 1
  %5 = load i64, ptr %value, align 1
  store i64 %5, ptr %"control value 20.2", align 1
  %6 = load i32, ptr %pointer_bytes, align 1
  store i32 %6, ptr %"control value 20.3", align 1
  %7 = load ptr, ptr %"control value 20.0", align 1
  %8 = load i32, ptr %"control value 20.1", align 1
  %9 = load i64, ptr %"control value 20.2", align 1
  %10 = load i32, ptr %"control value 20.3", align 1
  %11 = call i64 @runtime_format_value(ptr %7, i64 80, i32 %8, i64 %9, i32 %10)
  store i64 %11, ptr %"control value 20.4", align 1
  %12 = load i64, ptr %"control value 20.4", align 1
  store i64 %12, ptr %length, align 1
  %13 = load i64, ptr %length, align 1
  store i64 %13, ptr %"control value 20.5", align 1
  %14 = load i64, ptr %"control value 20.5", align 1
  %15 = icmp eq i64 %14, 0
  %16 = zext i1 %15 to i8
  store i8 %16, ptr %"control value 20.6", align 1
  %17 = load i8, ptr %"control value 20.6", align 1
  %18 = icmp ne i8 %17, 0
  br i1 %18, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret i8 0

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %19 = getelementptr i8, ptr %buffer, i64 0
  store ptr %19, ptr %"control value 20.7", align 1
  %20 = load i64, ptr %length, align 1
  store i64 %20, ptr %"control value 20.8", align 1
  %21 = load ptr, ptr %"control value 20.7", align 1
  %22 = load i64, ptr %"control value 20.8", align 1
  %23 = call zeroext i8 @runtime_write_all(i32 1, ptr %21, i64 %22)
  store i8 %23, ptr %"control value 20.9", align 1
  %24 = load i8, ptr %"control value 20.9", align 1
  ret i8 %24
}

define void @tower_print(i32 %0, i64 %1, i32 %2) {
entry:
  %kind = alloca i32, align 4
  %value = alloca i64, align 8
  %pointer_bytes = alloca i32, align 4
  %"control value 21.0" = alloca i32, align 4
  %"control value 21.1" = alloca i64, align 8
  %"control value 21.2" = alloca i32, align 4
  %"control value 21.3" = alloca i8, align 1
  store i32 %0, ptr %kind, align 1
  store i64 %1, ptr %value, align 1
  store i32 %2, ptr %pointer_bytes, align 1
  %3 = load i32, ptr %kind, align 1
  store i32 %3, ptr %"control value 21.0", align 1
  %4 = load i64, ptr %value, align 1
  store i64 %4, ptr %"control value 21.1", align 1
  %5 = load i32, ptr %pointer_bytes, align 1
  store i32 %5, ptr %"control value 21.2", align 1
  %6 = load i32, ptr %"control value 21.0", align 1
  %7 = load i64, ptr %"control value 21.1", align 1
  %8 = load i32, ptr %"control value 21.2", align 1
  %9 = call zeroext i8 @runtime_print_value(i32 %6, i64 %7, i32 %8)
  store i8 %9, ptr %"control value 21.3", align 1
  ret void
}

define void @tower_trap(ptr %0, i64 %1) {
entry:
  %message = alloca ptr, align 8
  %offset = alloca i64, align 8
  %length = alloca i64, align 8
  %"control check 22.0" = alloca i8, align 1
  %"control value 22.0" = alloca ptr, align 8
  %"control value 22.1" = alloca i64, align 8
  %"control value 22.2" = alloca i8, align 1
  %"control value 22.3" = alloca i8, align 1
  %"control value 22.4" = alloca i8, align 1
  %"control value 22.5" = alloca ptr, align 8
  %"control value 22.6" = alloca i64, align 8
  %"control value 22.7" = alloca i64, align 8
  %"control value 22.8" = alloca ptr, align 8
  %"control value 22.9" = alloca i64, align 8
  %"control value 22.10" = alloca i8, align 1
  %"control value 22.11" = alloca i8, align 1
  store ptr %0, ptr %message, align 1
  store i64 %1, ptr %offset, align 1
  store i64 0, ptr %length, align 1
  br label %loop

loop:                                             ; preds = %if.end, %entry
  %2 = load ptr, ptr %message, align 1
  store ptr %2, ptr %"control value 22.0", align 1
  %3 = load i64, ptr %length, align 1
  store i64 %3, ptr %"control value 22.1", align 1
  %4 = load ptr, ptr %"control value 22.0", align 1
  %5 = load i64, ptr %"control value 22.1", align 1
  %6 = mul i64 %5, 1
  %7 = getelementptr i8, ptr %4, i64 %6
  %8 = load i8, ptr %7, align 1
  store i8 %8, ptr %"control value 22.2", align 1
  %9 = load i8, ptr %"control value 22.2", align 1
  %10 = icmp ne i8 %9, 0
  %11 = zext i1 %10 to i8
  store i8 %11, ptr %"control value 22.3", align 1
  %12 = load i8, ptr %"control value 22.3", align 1
  store i8 %12, ptr %"control check 22.0", align 1
  %13 = load i8, ptr %"control check 22.0", align 1
  store i8 %13, ptr %"control value 22.4", align 1
  %14 = load i8, ptr %"control value 22.4", align 1
  %15 = icmp ne i8 %14, 0
  br i1 %15, label %if.body, label %if.else

loop.end:                                         ; preds = %if.else
  %16 = load ptr, ptr %message, align 1
  store ptr %16, ptr %"control value 22.8", align 1
  %17 = load i64, ptr %length, align 1
  store i64 %17, ptr %"control value 22.9", align 1
  %18 = load ptr, ptr %"control value 22.8", align 1
  %19 = load i64, ptr %"control value 22.9", align 1
  %20 = call zeroext i8 @runtime_write_all(i32 2, ptr %18, i64 %19)
  store i8 %20, ptr %"control value 22.10", align 1
  %21 = call zeroext i8 @runtime_write_all(i32 2, ptr @tower.string.3, i64 1)
  store i8 %21, ptr %"control value 22.11", align 1
  call void @guest_exit(i32 1)
  ret void

if.body:                                          ; preds = %loop
  store ptr %length, ptr %"control value 22.5", align 1
  %22 = load ptr, ptr %"control value 22.5", align 1
  %23 = load i64, ptr %22, align 1
  store i64 %23, ptr %"control value 22.6", align 1
  %24 = load i64, ptr %"control value 22.6", align 1
  %25 = add i64 %24, 1
  store i64 %25, ptr %"control value 22.7", align 1
  %26 = load ptr, ptr %"control value 22.5", align 1
  %27 = load i64, ptr %"control value 22.7", align 1
  store i64 %27, ptr %26, align 1
  br label %if.end

if.else:                                          ; preds = %loop
  br label %loop.end

if.end:                                           ; preds = %if.body
  br label %loop
}

declare void @tower_main()

define void @tower_start() {
entry:
  call void @tower_main()
  call void @guest_exit(i32 0)
  ret void
}

define i32 @guest_runtime_main() {
entry:
  call void @tower_main()
  ret i32 0
}

; Function Attrs: nocallback nofree nounwind willreturn memory(argmem: readwrite)
declare void @llvm.memmove.p0.p0.i64(ptr nocapture writeonly, ptr nocapture readonly, i64, i1 immarg) #0

; Function Attrs: naked
define void @_start() #1 {
entry:
  call void asm sideeffect "bl tower_start", ""()
  unreachable
}

attributes #0 = { nocallback nofree nounwind willreturn memory(argmem: readwrite) }
attributes #1 = { naked }
