; ModuleID = '/cache/values-workers-clean/guest-wasm32-unbound.ll'
source_filename = "Tower"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-unknown"

@0 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@1 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@2 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@3 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@4 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@5 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@6 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@7 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@8 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@9 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@10 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@11 = private unnamed_addr constant [17 x i8] c"Division by zero\00", align 1
@12 = private unnamed_addr constant [67 x i8] c"Numeric conversion out of range; use bits for bit reinterpretation\00", align 1
@__heap_base = external global i8
@tower.runtime.wasm.heap = private global [3 x i32] zeroinitializer, align 4

declare void @tower_print(i32, i64, i32) #0

declare void @tower_trap(ptr, i32) #1

define internal i8 @tower.fn.guest_runtime_product(i32 %0, i32 %1) {
entry:
  %count = alloca i32, align 4
  %size = alloca i32, align 4
  %maximum = alloca i32, align 4
  %limit = alloca i32, align 4
  %"control value 1.0" = alloca ptr, align 4
  %"control value 1.1" = alloca i32, align 4
  %"control value 1.2" = alloca i32, align 4
  %"control value 1.3" = alloca i32, align 4
  %"control value 1.4" = alloca i8, align 1
  %"control value 1.5" = alloca i32, align 4
  %"control value 1.6" = alloca i32, align 4
  %"control value 1.7" = alloca i32, align 4
  %"control value 1.8" = alloca i32, align 4
  %"control value 1.9" = alloca i32, align 4
  %"control value 1.10" = alloca i8, align 1
  store i32 %0, ptr %count, align 1
  store i32 %1, ptr %size, align 1
  store i32 0, ptr %maximum, align 1
  store ptr %maximum, ptr %"control value 1.0", align 1
  %2 = load ptr, ptr %"control value 1.0", align 1
  %3 = load i32, ptr %2, align 1
  store i32 %3, ptr %"control value 1.1", align 1
  %4 = load i32, ptr %"control value 1.1", align 1
  %5 = sub i32 %4, 1
  store i32 %5, ptr %"control value 1.2", align 1
  %6 = load ptr, ptr %"control value 1.0", align 1
  %7 = load i32, ptr %"control value 1.2", align 1
  store i32 %7, ptr %6, align 1
  %8 = load i32, ptr %size, align 1
  store i32 %8, ptr %"control value 1.3", align 1
  %9 = load i32, ptr %"control value 1.3", align 1
  %10 = icmp ne i32 %9, 0
  %11 = zext i1 %10 to i8
  store i8 %11, ptr %"control value 1.4", align 1
  %12 = load i8, ptr %"control value 1.4", align 1
  %13 = icmp ne i8 %12, 0
  br i1 %13, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %14 = load i32, ptr %maximum, align 1
  store i32 %14, ptr %"control value 1.5", align 1
  %15 = load i32, ptr %size, align 1
  store i32 %15, ptr %"control value 1.6", align 1
  %16 = load i32, ptr %"control value 1.5", align 1
  %17 = load i32, ptr %"control value 1.6", align 1
  %18 = icmp ne i32 %17, 0
  br i1 %18, label %valid, label %error

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.end3, %if.else
  ret i8 1

valid:                                            ; preds = %if.body
  %19 = udiv i32 %16, %17
  store i32 %19, ptr %"control value 1.7", align 1
  %20 = load i32, ptr %"control value 1.7", align 1
  store i32 %20, ptr %limit, align 1
  %21 = load i32, ptr %count, align 1
  store i32 %21, ptr %"control value 1.8", align 1
  %22 = load i32, ptr %limit, align 1
  store i32 %22, ptr %"control value 1.9", align 1
  %23 = load i32, ptr %"control value 1.8", align 1
  %24 = load i32, ptr %"control value 1.9", align 1
  %25 = icmp ugt i32 %23, %24
  %26 = zext i1 %25 to i8
  store i8 %26, ptr %"control value 1.10", align 1
  %27 = load i8, ptr %"control value 1.10", align 1
  %28 = icmp ne i8 %27, 0
  br i1 %28, label %if.body1, label %if.else2

error:                                            ; preds = %if.body
  call void @tower_trap(ptr @0, i32 15239)
  unreachable

if.body1:                                         ; preds = %valid
  ret i8 0

if.else2:                                         ; preds = %valid
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  br label %if.end
}

define ptr @tower_allocate(i32 %0, i32 %1) {
entry:
  %count = alloca i32, align 4
  %size = alloca i32, align 4
  %bytes = alloca i32, align 4
  %"control value 2.0" = alloca i32, align 4
  %"control value 2.1" = alloca i32, align 4
  %"control value 2.2" = alloca i8, align 1
  %"control value 2.3" = alloca i8, align 1
  %"control value 2.4" = alloca i32, align 4
  %"control value 2.5" = alloca i32, align 4
  %"control value 2.6" = alloca i32, align 4
  %"control value 2.7" = alloca i32, align 4
  %"control value 2.8" = alloca ptr, align 4
  store i32 %0, ptr %count, align 1
  store i32 %1, ptr %size, align 1
  %2 = load i32, ptr %count, align 1
  store i32 %2, ptr %"control value 2.0", align 1
  %3 = load i32, ptr %size, align 1
  store i32 %3, ptr %"control value 2.1", align 1
  %4 = load i32, ptr %"control value 2.0", align 1
  %5 = load i32, ptr %"control value 2.1", align 1
  %6 = call i8 @tower.fn.guest_runtime_product(i32 %4, i32 %5)
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
  %12 = load i32, ptr %count, align 1
  store i32 %12, ptr %"control value 2.4", align 1
  %13 = load i32, ptr %size, align 1
  store i32 %13, ptr %"control value 2.5", align 1
  %14 = load i32, ptr %"control value 2.4", align 1
  %15 = load i32, ptr %"control value 2.5", align 1
  %16 = mul i32 %14, %15
  store i32 %16, ptr %"control value 2.6", align 1
  %17 = load i32, ptr %"control value 2.6", align 1
  store i32 %17, ptr %bytes, align 1
  %18 = load i32, ptr %bytes, align 1
  store i32 %18, ptr %"control value 2.7", align 1
  %19 = load i32, ptr %"control value 2.7", align 1
  %20 = call ptr @malloc(i32 %19) #8
  store ptr %20, ptr %"control value 2.8", align 1
  %21 = load ptr, ptr %"control value 2.8", align 1
  ret ptr %21
}

define ptr @tower_reallocate(ptr %0, i32 %1, i32 %2) {
entry:
  %pointer = alloca ptr, align 4
  %count = alloca i32, align 4
  %size = alloca i32, align 4
  %bytes = alloca i32, align 4
  %"control value 3.0" = alloca i32, align 4
  %"control value 3.1" = alloca i32, align 4
  %"control value 3.2" = alloca i8, align 1
  %"control value 3.3" = alloca i8, align 1
  %"control value 3.4" = alloca i32, align 4
  %"control value 3.5" = alloca i32, align 4
  %"control value 3.6" = alloca i32, align 4
  %"control value 3.7" = alloca ptr, align 4
  %"control value 3.8" = alloca i32, align 4
  %"control value 3.9" = alloca ptr, align 4
  store ptr %0, ptr %pointer, align 1
  store i32 %1, ptr %count, align 1
  store i32 %2, ptr %size, align 1
  %3 = load i32, ptr %count, align 1
  store i32 %3, ptr %"control value 3.0", align 1
  %4 = load i32, ptr %size, align 1
  store i32 %4, ptr %"control value 3.1", align 1
  %5 = load i32, ptr %"control value 3.0", align 1
  %6 = load i32, ptr %"control value 3.1", align 1
  %7 = call i8 @tower.fn.guest_runtime_product(i32 %5, i32 %6)
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
  %13 = load i32, ptr %count, align 1
  store i32 %13, ptr %"control value 3.4", align 1
  %14 = load i32, ptr %size, align 1
  store i32 %14, ptr %"control value 3.5", align 1
  %15 = load i32, ptr %"control value 3.4", align 1
  %16 = load i32, ptr %"control value 3.5", align 1
  %17 = mul i32 %15, %16
  store i32 %17, ptr %"control value 3.6", align 1
  %18 = load i32, ptr %"control value 3.6", align 1
  store i32 %18, ptr %bytes, align 1
  %19 = load ptr, ptr %pointer, align 1
  store ptr %19, ptr %"control value 3.7", align 1
  %20 = load i32, ptr %bytes, align 1
  store i32 %20, ptr %"control value 3.8", align 1
  %21 = load ptr, ptr %"control value 3.7", align 1
  %22 = load i32, ptr %"control value 3.8", align 1
  %23 = call ptr @realloc(ptr %21, i32 %22) #9
  store ptr %23, ptr %"control value 3.9", align 1
  %24 = load ptr, ptr %"control value 3.9", align 1
  ret ptr %24
}

define void @tower_deallocate(ptr %0) {
entry:
  %pointer = alloca ptr, align 4
  %"control value 4.0" = alloca ptr, align 4
  store ptr %0, ptr %pointer, align 1
  %1 = load ptr, ptr %pointer, align 1
  store ptr %1, ptr %"control value 4.0", align 1
  %2 = load ptr, ptr %"control value 4.0", align 1
  call void @free(ptr %2) #10
  ret void
}

define ptr @memcpy(ptr %0, ptr %1, i32 %2) {
entry:
  %destination = alloca ptr, align 4
  %source = alloca ptr, align 4
  %count = alloca i32, align 4
  %out = alloca ptr, align 4
  %input = alloca ptr, align 4
  %i = alloca i32, align 4
  %"control check 5.0" = alloca i8, align 1
  %"control value 5.0" = alloca ptr, align 4
  %"control value 5.1" = alloca ptr, align 4
  %"control value 5.2" = alloca ptr, align 4
  %"control value 5.3" = alloca ptr, align 4
  %"control value 5.4" = alloca i32, align 4
  %"control value 5.5" = alloca i32, align 4
  %"control value 5.6" = alloca i8, align 1
  %"control value 5.7" = alloca i8, align 1
  %"control value 5.8" = alloca ptr, align 4
  %"control value 5.9" = alloca i32, align 4
  %"control value 5.10" = alloca ptr, align 4
  %"control value 5.11" = alloca ptr, align 4
  %"control value 5.12" = alloca i32, align 4
  %"control value 5.13" = alloca i8, align 1
  %"control value 5.14" = alloca ptr, align 4
  %"control value 5.15" = alloca i32, align 4
  %"control value 5.16" = alloca i32, align 4
  %"control value 5.17" = alloca ptr, align 4
  store ptr %0, ptr %destination, align 1
  store ptr %1, ptr %source, align 1
  store i32 %2, ptr %count, align 1
  %3 = load ptr, ptr %destination, align 1
  store ptr %3, ptr %"control value 5.0", align 1
  %4 = load ptr, ptr %"control value 5.0", align 1
  store ptr %4, ptr %"control value 5.1", align 1
  %5 = load ptr, ptr %"control value 5.1", align 1
  store ptr %5, ptr %out, align 1
  %6 = load ptr, ptr %source, align 1
  store ptr %6, ptr %"control value 5.2", align 1
  %7 = load ptr, ptr %"control value 5.2", align 1
  store ptr %7, ptr %"control value 5.3", align 1
  %8 = load ptr, ptr %"control value 5.3", align 1
  store ptr %8, ptr %input, align 1
  store i32 0, ptr %i, align 1
  br label %loop

loop:                                             ; preds = %if.end, %entry
  %9 = load i32, ptr %i, align 1
  store i32 %9, ptr %"control value 5.4", align 1
  %10 = load i32, ptr %count, align 1
  store i32 %10, ptr %"control value 5.5", align 1
  %11 = load i32, ptr %"control value 5.4", align 1
  %12 = load i32, ptr %"control value 5.5", align 1
  %13 = icmp ult i32 %11, %12
  %14 = zext i1 %13 to i8
  store i8 %14, ptr %"control value 5.6", align 1
  %15 = load i8, ptr %"control value 5.6", align 1
  store i8 %15, ptr %"control check 5.0", align 1
  %16 = load i8, ptr %"control check 5.0", align 1
  store i8 %16, ptr %"control value 5.7", align 1
  %17 = load i8, ptr %"control value 5.7", align 1
  %18 = icmp ne i8 %17, 0
  br i1 %18, label %if.body, label %if.else

loop.end:                                         ; preds = %if.else
  %19 = load ptr, ptr %destination, align 1
  store ptr %19, ptr %"control value 5.17", align 1
  %20 = load ptr, ptr %"control value 5.17", align 1
  ret ptr %20

if.body:                                          ; preds = %loop
  %21 = load ptr, ptr %out, align 1
  store ptr %21, ptr %"control value 5.8", align 1
  %22 = load i32, ptr %i, align 1
  store i32 %22, ptr %"control value 5.9", align 1
  %23 = load ptr, ptr %"control value 5.8", align 1
  %24 = load i32, ptr %"control value 5.9", align 1
  %25 = mul i32 %24, 1
  %26 = getelementptr i8, ptr %23, i32 %25
  store ptr %26, ptr %"control value 5.10", align 1
  %27 = load ptr, ptr %input, align 1
  store ptr %27, ptr %"control value 5.11", align 1
  %28 = load i32, ptr %i, align 1
  store i32 %28, ptr %"control value 5.12", align 1
  %29 = load ptr, ptr %"control value 5.11", align 1
  %30 = load i32, ptr %"control value 5.12", align 1
  %31 = mul i32 %30, 1
  %32 = getelementptr i8, ptr %29, i32 %31
  %33 = load i8, ptr %32, align 1
  store i8 %33, ptr %"control value 5.13", align 1
  %34 = load ptr, ptr %"control value 5.10", align 1
  %35 = load i8, ptr %"control value 5.13", align 1
  store i8 %35, ptr %34, align 1
  store ptr %i, ptr %"control value 5.14", align 1
  %36 = load ptr, ptr %"control value 5.14", align 1
  %37 = load i32, ptr %36, align 1
  store i32 %37, ptr %"control value 5.15", align 1
  %38 = load i32, ptr %"control value 5.15", align 1
  %39 = add i32 %38, 1
  store i32 %39, ptr %"control value 5.16", align 1
  %40 = load ptr, ptr %"control value 5.14", align 1
  %41 = load i32, ptr %"control value 5.16", align 1
  store i32 %41, ptr %40, align 1
  br label %if.end

if.else:                                          ; preds = %loop
  br label %loop.end

if.end:                                           ; preds = %if.body
  br label %loop
}

define ptr @memmove(ptr %0, ptr %1, i32 %2) {
entry:
  %destination = alloca ptr, align 4
  %source = alloca ptr, align 4
  %count = alloca i32, align 4
  %out = alloca ptr, align 4
  %input = alloca ptr, align 4
  %i = alloca i32, align 4
  %"control check 6.0" = alloca i8, align 1
  %"control value 6.0" = alloca ptr, align 4
  %"control value 6.1" = alloca ptr, align 4
  %"control value 6.2" = alloca ptr, align 4
  %"control value 6.3" = alloca ptr, align 4
  %"control value 6.4" = alloca ptr, align 4
  %"control value 6.5" = alloca i32, align 4
  %"control value 6.6" = alloca ptr, align 4
  %"control value 6.7" = alloca i32, align 4
  %"control value 6.8" = alloca i8, align 1
  %"control value 6.9" = alloca ptr, align 4
  %"control value 6.10" = alloca ptr, align 4
  %"control value 6.11" = alloca i32, align 4
  %"control value 6.12" = alloca ptr, align 4
  %"control value 6.13" = alloca i32, align 4
  %"control value 6.14" = alloca i32, align 4
  %"control value 6.15" = alloca i8, align 1
  %"control value 6.16" = alloca i8, align 1
  %"control value 6.17" = alloca ptr, align 4
  %"control value 6.18" = alloca i32, align 4
  %"control value 6.19" = alloca i32, align 4
  %"control value 6.20" = alloca ptr, align 4
  %"control value 6.21" = alloca i32, align 4
  %"control value 6.22" = alloca ptr, align 4
  %"control value 6.23" = alloca ptr, align 4
  %"control value 6.24" = alloca i32, align 4
  %"control value 6.25" = alloca i8, align 1
  %"control value 6.26" = alloca ptr, align 4
  store ptr %0, ptr %destination, align 1
  store ptr %1, ptr %source, align 1
  store i32 %2, ptr %count, align 1
  %3 = load ptr, ptr %destination, align 1
  store ptr %3, ptr %"control value 6.0", align 1
  %4 = load ptr, ptr %"control value 6.0", align 1
  store ptr %4, ptr %"control value 6.1", align 1
  %5 = load ptr, ptr %"control value 6.1", align 1
  store ptr %5, ptr %out, align 1
  %6 = load ptr, ptr %source, align 1
  store ptr %6, ptr %"control value 6.2", align 1
  %7 = load ptr, ptr %"control value 6.2", align 1
  store ptr %7, ptr %"control value 6.3", align 1
  %8 = load ptr, ptr %"control value 6.3", align 1
  store ptr %8, ptr %input, align 1
  %9 = load ptr, ptr %out, align 1
  store ptr %9, ptr %"control value 6.4", align 1
  %10 = load ptr, ptr %"control value 6.4", align 1
  %11 = ptrtoint ptr %10 to i32
  store i32 %11, ptr %"control value 6.5", align 1
  %12 = load ptr, ptr %input, align 1
  store ptr %12, ptr %"control value 6.6", align 1
  %13 = load ptr, ptr %"control value 6.6", align 1
  %14 = ptrtoint ptr %13 to i32
  store i32 %14, ptr %"control value 6.7", align 1
  %15 = load i32, ptr %"control value 6.5", align 1
  %16 = load i32, ptr %"control value 6.7", align 1
  %17 = icmp ult i32 %15, %16
  %18 = zext i1 %17 to i8
  store i8 %18, ptr %"control value 6.8", align 1
  %19 = load i8, ptr %"control value 6.8", align 1
  %20 = icmp ne i8 %19, 0
  br i1 %20, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %21 = load ptr, ptr %destination, align 1
  store ptr %21, ptr %"control value 6.9", align 1
  %22 = load ptr, ptr %source, align 1
  store ptr %22, ptr %"control value 6.10", align 1
  %23 = load i32, ptr %count, align 1
  store i32 %23, ptr %"control value 6.11", align 1
  %24 = load ptr, ptr %"control value 6.9", align 1
  %25 = load ptr, ptr %"control value 6.10", align 1
  %26 = load i32, ptr %"control value 6.11", align 1
  %27 = call ptr @memcpy(ptr %24, ptr %25, i32 %26) #11
  store ptr %27, ptr %"control value 6.12", align 1
  %28 = load ptr, ptr %"control value 6.12", align 1
  ret ptr %28

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %29 = load i32, ptr %count, align 1
  store i32 %29, ptr %"control value 6.13", align 1
  %30 = load i32, ptr %"control value 6.13", align 1
  store i32 %30, ptr %i, align 1
  br label %loop

loop:                                             ; preds = %if.end3, %if.end
  %31 = load i32, ptr %i, align 1
  store i32 %31, ptr %"control value 6.14", align 1
  %32 = load i32, ptr %"control value 6.14", align 1
  %33 = icmp ne i32 %32, 0
  %34 = zext i1 %33 to i8
  store i8 %34, ptr %"control value 6.15", align 1
  %35 = load i8, ptr %"control value 6.15", align 1
  store i8 %35, ptr %"control check 6.0", align 1
  %36 = load i8, ptr %"control check 6.0", align 1
  store i8 %36, ptr %"control value 6.16", align 1
  %37 = load i8, ptr %"control value 6.16", align 1
  %38 = icmp ne i8 %37, 0
  br i1 %38, label %if.body1, label %if.else2

loop.end:                                         ; preds = %if.else2
  %39 = load ptr, ptr %destination, align 1
  store ptr %39, ptr %"control value 6.26", align 1
  %40 = load ptr, ptr %"control value 6.26", align 1
  ret ptr %40

if.body1:                                         ; preds = %loop
  store ptr %i, ptr %"control value 6.17", align 1
  %41 = load ptr, ptr %"control value 6.17", align 1
  %42 = load i32, ptr %41, align 1
  store i32 %42, ptr %"control value 6.18", align 1
  %43 = load i32, ptr %"control value 6.18", align 1
  %44 = sub i32 %43, 1
  store i32 %44, ptr %"control value 6.19", align 1
  %45 = load ptr, ptr %"control value 6.17", align 1
  %46 = load i32, ptr %"control value 6.19", align 1
  store i32 %46, ptr %45, align 1
  %47 = load ptr, ptr %out, align 1
  store ptr %47, ptr %"control value 6.20", align 1
  %48 = load i32, ptr %i, align 1
  store i32 %48, ptr %"control value 6.21", align 1
  %49 = load ptr, ptr %"control value 6.20", align 1
  %50 = load i32, ptr %"control value 6.21", align 1
  %51 = mul i32 %50, 1
  %52 = getelementptr i8, ptr %49, i32 %51
  store ptr %52, ptr %"control value 6.22", align 1
  %53 = load ptr, ptr %input, align 1
  store ptr %53, ptr %"control value 6.23", align 1
  %54 = load i32, ptr %i, align 1
  store i32 %54, ptr %"control value 6.24", align 1
  %55 = load ptr, ptr %"control value 6.23", align 1
  %56 = load i32, ptr %"control value 6.24", align 1
  %57 = mul i32 %56, 1
  %58 = getelementptr i8, ptr %55, i32 %57
  %59 = load i8, ptr %58, align 1
  store i8 %59, ptr %"control value 6.25", align 1
  %60 = load ptr, ptr %"control value 6.22", align 1
  %61 = load i8, ptr %"control value 6.25", align 1
  store i8 %61, ptr %60, align 1
  br label %if.end3

if.else2:                                         ; preds = %loop
  br label %loop.end

if.end3:                                          ; preds = %if.body1
  br label %loop
}

define ptr @memset(ptr %0, i32 %1, i32 %2) {
entry:
  %destination = alloca ptr, align 4
  %value = alloca i32, align 4
  %count = alloca i32, align 4
  %out = alloca ptr, align 4
  %low = alloca i32, align 4
  %byte = alloca i8, align 1
  %i = alloca i32, align 4
  %"control check 7.0" = alloca i8, align 1
  %"control value 7.0" = alloca ptr, align 4
  %"control value 7.1" = alloca ptr, align 4
  %"control value 7.2" = alloca i32, align 4
  %"control value 7.3" = alloca i32, align 4
  %"control value 7.4" = alloca i32, align 4
  %"control value 7.5" = alloca i32, align 4
  %"control value 7.6" = alloca i8, align 1
  %"control value 7.7" = alloca i32, align 4
  %"control value 7.8" = alloca i32, align 4
  %"control value 7.9" = alloca i8, align 1
  %"control value 7.10" = alloca i8, align 1
  %"control value 7.11" = alloca ptr, align 4
  %"control value 7.12" = alloca i32, align 4
  %"control value 7.13" = alloca ptr, align 4
  %"control value 7.14" = alloca i8, align 1
  %"control value 7.15" = alloca ptr, align 4
  %"control value 7.16" = alloca i32, align 4
  %"control value 7.17" = alloca i32, align 4
  %"control value 7.18" = alloca ptr, align 4
  store ptr %0, ptr %destination, align 1
  store i32 %1, ptr %value, align 1
  store i32 %2, ptr %count, align 1
  %3 = load ptr, ptr %destination, align 1
  store ptr %3, ptr %"control value 7.0", align 1
  %4 = load ptr, ptr %"control value 7.0", align 1
  store ptr %4, ptr %"control value 7.1", align 1
  %5 = load ptr, ptr %"control value 7.1", align 1
  store ptr %5, ptr %out, align 1
  %6 = load i32, ptr %value, align 1
  store i32 %6, ptr %"control value 7.2", align 1
  %7 = load i32, ptr %"control value 7.2", align 1
  store i32 %7, ptr %"control value 7.3", align 1
  %8 = load i32, ptr %"control value 7.3", align 1
  %9 = and i32 %8, 255
  store i32 %9, ptr %"control value 7.4", align 1
  %10 = load i32, ptr %"control value 7.4", align 1
  store i32 %10, ptr %low, align 1
  %11 = load i32, ptr %low, align 1
  store i32 %11, ptr %"control value 7.5", align 1
  %12 = load i32, ptr %"control value 7.5", align 1
  %13 = zext i32 %12 to i64
  %14 = icmp ule i64 %13, 255
  %15 = and i1 true, %14
  br i1 %15, label %valid, label %error

valid:                                            ; preds = %entry
  %16 = trunc i32 %12 to i8
  store i8 %16, ptr %"control value 7.6", align 1
  %17 = load i8, ptr %"control value 7.6", align 1
  store i8 %17, ptr %byte, align 1
  store i32 0, ptr %i, align 1
  br label %loop

error:                                            ; preds = %entry
  call void @tower_trap(ptr @1, i32 16381)
  unreachable

loop:                                             ; preds = %if.end, %valid
  %18 = load i32, ptr %i, align 1
  store i32 %18, ptr %"control value 7.7", align 1
  %19 = load i32, ptr %count, align 1
  store i32 %19, ptr %"control value 7.8", align 1
  %20 = load i32, ptr %"control value 7.7", align 1
  %21 = load i32, ptr %"control value 7.8", align 1
  %22 = icmp ult i32 %20, %21
  %23 = zext i1 %22 to i8
  store i8 %23, ptr %"control value 7.9", align 1
  %24 = load i8, ptr %"control value 7.9", align 1
  store i8 %24, ptr %"control check 7.0", align 1
  %25 = load i8, ptr %"control check 7.0", align 1
  store i8 %25, ptr %"control value 7.10", align 1
  %26 = load i8, ptr %"control value 7.10", align 1
  %27 = icmp ne i8 %26, 0
  br i1 %27, label %if.body, label %if.else

loop.end:                                         ; preds = %if.else
  %28 = load ptr, ptr %destination, align 1
  store ptr %28, ptr %"control value 7.18", align 1
  %29 = load ptr, ptr %"control value 7.18", align 1
  ret ptr %29

if.body:                                          ; preds = %loop
  %30 = load ptr, ptr %out, align 1
  store ptr %30, ptr %"control value 7.11", align 1
  %31 = load i32, ptr %i, align 1
  store i32 %31, ptr %"control value 7.12", align 1
  %32 = load ptr, ptr %"control value 7.11", align 1
  %33 = load i32, ptr %"control value 7.12", align 1
  %34 = mul i32 %33, 1
  %35 = getelementptr i8, ptr %32, i32 %34
  store ptr %35, ptr %"control value 7.13", align 1
  %36 = load i8, ptr %byte, align 1
  store i8 %36, ptr %"control value 7.14", align 1
  %37 = load ptr, ptr %"control value 7.13", align 1
  %38 = load i8, ptr %"control value 7.14", align 1
  store i8 %38, ptr %37, align 1
  store ptr %i, ptr %"control value 7.15", align 1
  %39 = load ptr, ptr %"control value 7.15", align 1
  %40 = load i32, ptr %39, align 1
  store i32 %40, ptr %"control value 7.16", align 1
  %41 = load i32, ptr %"control value 7.16", align 1
  %42 = add i32 %41, 1
  store i32 %42, ptr %"control value 7.17", align 1
  %43 = load ptr, ptr %"control value 7.15", align 1
  %44 = load i32, ptr %"control value 7.17", align 1
  store i32 %44, ptr %43, align 1
  br label %if.end

if.else:                                          ; preds = %loop
  br label %loop.end

if.end:                                           ; preds = %if.body
  br label %loop
}

define zeroext i8 @guest_heap_init(ptr %0, ptr %1, ptr %2) {
entry:
  %heap = alloca ptr, align 4
  %begin = alloca ptr, align 4
  %end = alloca ptr, align 4
  %first = alloca i32, align 4
  %limit = alloca i32, align 4
  %invalid = alloca i8, align 1
  %aligned = alloca i32, align 4
  %"control value 8.0" = alloca ptr, align 4
  %"control value 8.1" = alloca i32, align 4
  %"control value 8.2" = alloca ptr, align 4
  %"control value 8.3" = alloca i32, align 4
  %"control value 8.4" = alloca ptr, align 4
  %"control value 8.5" = alloca i32, align 4
  %"control value 8.6" = alloca i32, align 4
  %"control value 8.7" = alloca i8, align 1
  %"control value 8.8" = alloca i8, align 1
  %"control value 8.9" = alloca i32, align 4
  %"control value 8.10" = alloca i32, align 4
  %"control value 8.11" = alloca ptr, align 4
  %"control value 8.12" = alloca i32, align 4
  %"control value 8.13" = alloca i32, align 4
  %"control value 8.14" = alloca i8, align 1
  %"control value 8.15" = alloca i8, align 1
  %"control value 8.16" = alloca ptr, align 4
  %"control value 8.17" = alloca i32, align 4
  %"control value 8.18" = alloca i32, align 4
  %"control value 8.19" = alloca ptr, align 4
  %"control value 8.20" = alloca i32, align 4
  %"control value 8.21" = alloca i32, align 4
  %"control value 8.22" = alloca ptr, align 4
  %"control value 8.23" = alloca i32, align 4
  %"control value 8.24" = alloca i32, align 4
  %"control value 8.25" = alloca i8, align 1
  %"control value 8.26" = alloca i8, align 1
  %"control value 8.27" = alloca ptr, align 4
  %"control value 8.28" = alloca ptr, align 4
  %"control value 8.29" = alloca i32, align 4
  %"control value 8.30" = alloca ptr, align 4
  %"control value 8.31" = alloca ptr, align 4
  %"control value 8.32" = alloca i32, align 4
  store ptr %0, ptr %heap, align 1
  store ptr %1, ptr %begin, align 1
  store ptr %2, ptr %end, align 1
  %3 = load ptr, ptr %heap, align 1
  store ptr %3, ptr %"control value 8.0", align 1
  store i32 12, ptr %"control value 8.1", align 1
  %4 = load ptr, ptr %"control value 8.0", align 1
  %5 = load i32, ptr %"control value 8.1", align 1
  call void @llvm.memset.p0.i32(ptr align 1 %4, i8 0, i32 %5, i1 false)
  %6 = load ptr, ptr %begin, align 1
  store ptr %6, ptr %"control value 8.2", align 1
  %7 = load ptr, ptr %"control value 8.2", align 1
  %8 = ptrtoint ptr %7 to i32
  store i32 %8, ptr %"control value 8.3", align 1
  %9 = load i32, ptr %"control value 8.3", align 1
  store i32 %9, ptr %first, align 1
  %10 = load ptr, ptr %end, align 1
  store ptr %10, ptr %"control value 8.4", align 1
  %11 = load ptr, ptr %"control value 8.4", align 1
  %12 = ptrtoint ptr %11 to i32
  store i32 %12, ptr %"control value 8.5", align 1
  %13 = load i32, ptr %"control value 8.5", align 1
  store i32 %13, ptr %limit, align 1
  %14 = load i32, ptr %first, align 1
  store i32 %14, ptr %"control value 8.6", align 1
  %15 = load i32, ptr %"control value 8.6", align 1
  %16 = icmp eq i32 %15, 0
  %17 = zext i1 %16 to i8
  store i8 %17, ptr %"control value 8.7", align 1
  %18 = load i8, ptr %"control value 8.7", align 1
  store i8 %18, ptr %invalid, align 1
  %19 = load i8, ptr %invalid, align 1
  store i8 %19, ptr %"control value 8.8", align 1
  %20 = load i8, ptr %"control value 8.8", align 1
  %21 = icmp ne i8 %20, 0
  br i1 %21, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret i8 0

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %22 = load i32, ptr %first, align 1
  store i32 %22, ptr %"control value 8.9", align 1
  %23 = load i32, ptr %"control value 8.9", align 1
  %24 = add i32 %23, 15
  store i32 %24, ptr %"control value 8.10", align 1
  %25 = load i32, ptr %"control value 8.10", align 1
  store i32 %25, ptr %aligned, align 1
  store ptr %invalid, ptr %"control value 8.11", align 1
  %26 = load i32, ptr %aligned, align 1
  store i32 %26, ptr %"control value 8.12", align 1
  %27 = load i32, ptr %first, align 1
  store i32 %27, ptr %"control value 8.13", align 1
  %28 = load i32, ptr %"control value 8.12", align 1
  %29 = load i32, ptr %"control value 8.13", align 1
  %30 = icmp ult i32 %28, %29
  %31 = zext i1 %30 to i8
  store i8 %31, ptr %"control value 8.14", align 1
  %32 = load ptr, ptr %"control value 8.11", align 1
  %33 = load i8, ptr %"control value 8.14", align 1
  store i8 %33, ptr %32, align 1
  %34 = load i8, ptr %invalid, align 1
  store i8 %34, ptr %"control value 8.15", align 1
  %35 = load i8, ptr %"control value 8.15", align 1
  %36 = icmp ne i8 %35, 0
  br i1 %36, label %if.body1, label %if.else2

if.body1:                                         ; preds = %if.end
  ret i8 0

if.else2:                                         ; preds = %if.end
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  store ptr %aligned, ptr %"control value 8.16", align 1
  %37 = load i32, ptr %aligned, align 1
  store i32 %37, ptr %"control value 8.17", align 1
  %38 = load i32, ptr %"control value 8.17", align 1
  br i1 true, label %valid, label %error

valid:                                            ; preds = %if.end3
  %39 = udiv i32 %38, 16
  store i32 %39, ptr %"control value 8.18", align 1
  %40 = load ptr, ptr %"control value 8.16", align 1
  %41 = load i32, ptr %"control value 8.18", align 1
  store i32 %41, ptr %40, align 1
  store ptr %aligned, ptr %"control value 8.19", align 1
  %42 = load i32, ptr %aligned, align 1
  store i32 %42, ptr %"control value 8.20", align 1
  %43 = load i32, ptr %"control value 8.20", align 1
  %44 = mul i32 %43, 16
  store i32 %44, ptr %"control value 8.21", align 1
  %45 = load ptr, ptr %"control value 8.19", align 1
  %46 = load i32, ptr %"control value 8.21", align 1
  store i32 %46, ptr %45, align 1
  store ptr %invalid, ptr %"control value 8.22", align 1
  %47 = load i32, ptr %aligned, align 1
  store i32 %47, ptr %"control value 8.23", align 1
  %48 = load i32, ptr %limit, align 1
  store i32 %48, ptr %"control value 8.24", align 1
  %49 = load i32, ptr %"control value 8.23", align 1
  %50 = load i32, ptr %"control value 8.24", align 1
  %51 = icmp ugt i32 %49, %50
  %52 = zext i1 %51 to i8
  store i8 %52, ptr %"control value 8.25", align 1
  %53 = load ptr, ptr %"control value 8.22", align 1
  %54 = load i8, ptr %"control value 8.25", align 1
  store i8 %54, ptr %53, align 1
  %55 = load i8, ptr %invalid, align 1
  store i8 %55, ptr %"control value 8.26", align 1
  %56 = load i8, ptr %"control value 8.26", align 1
  %57 = icmp ne i8 %56, 0
  br i1 %57, label %if.body4, label %if.else5

error:                                            ; preds = %if.end3
  call void @tower_trap(ptr @2, i32 17520)
  unreachable

if.body4:                                         ; preds = %valid
  ret i8 0

if.else5:                                         ; preds = %valid
  br label %if.end6

if.end6:                                          ; preds = %if.else5
  %58 = load ptr, ptr %heap, align 1
  store ptr %58, ptr %"control value 8.27", align 1
  %59 = load ptr, ptr %"control value 8.27", align 1
  %60 = getelementptr i8, ptr %59, i32 4
  store ptr %60, ptr %"control value 8.28", align 1
  %61 = load i32, ptr %aligned, align 1
  store i32 %61, ptr %"control value 8.29", align 1
  %62 = load ptr, ptr %"control value 8.28", align 1
  %63 = load i32, ptr %"control value 8.29", align 1
  store i32 %63, ptr %62, align 1
  %64 = load ptr, ptr %heap, align 1
  store ptr %64, ptr %"control value 8.30", align 1
  %65 = load ptr, ptr %"control value 8.30", align 1
  %66 = getelementptr i8, ptr %65, i32 8
  store ptr %66, ptr %"control value 8.31", align 1
  %67 = load i32, ptr %limit, align 1
  store i32 %67, ptr %"control value 8.32", align 1
  %68 = load ptr, ptr %"control value 8.31", align 1
  %69 = load i32, ptr %"control value 8.32", align 1
  store i32 %69, ptr %68, align 1
  ret i8 1
}

define zeroext i8 @guest_heap_extend(ptr %0, ptr %1) {
entry:
  %heap = alloca ptr, align 4
  %end = alloca ptr, align 4
  %limit = alloca i32, align 4
  %"control value 9.0" = alloca ptr, align 4
  %"control value 9.1" = alloca i32, align 4
  %"control value 9.2" = alloca i32, align 4
  %"control value 9.3" = alloca ptr, align 4
  %"control value 9.4" = alloca i32, align 4
  %"control value 9.5" = alloca i8, align 1
  %"control value 9.6" = alloca ptr, align 4
  %"control value 9.7" = alloca ptr, align 4
  %"control value 9.8" = alloca i32, align 4
  store ptr %0, ptr %heap, align 1
  store ptr %1, ptr %end, align 1
  %2 = load ptr, ptr %end, align 1
  store ptr %2, ptr %"control value 9.0", align 1
  %3 = load ptr, ptr %"control value 9.0", align 1
  %4 = ptrtoint ptr %3 to i32
  store i32 %4, ptr %"control value 9.1", align 1
  %5 = load i32, ptr %"control value 9.1", align 1
  store i32 %5, ptr %limit, align 1
  %6 = load i32, ptr %limit, align 1
  store i32 %6, ptr %"control value 9.2", align 1
  %7 = load ptr, ptr %heap, align 1
  store ptr %7, ptr %"control value 9.3", align 1
  %8 = load ptr, ptr %"control value 9.3", align 1
  %9 = getelementptr i8, ptr %8, i32 8
  %10 = load i32, ptr %9, align 1
  store i32 %10, ptr %"control value 9.4", align 1
  %11 = load i32, ptr %"control value 9.2", align 1
  %12 = load i32, ptr %"control value 9.4", align 1
  %13 = icmp ult i32 %11, %12
  %14 = zext i1 %13 to i8
  store i8 %14, ptr %"control value 9.5", align 1
  %15 = load i8, ptr %"control value 9.5", align 1
  %16 = icmp ne i8 %15, 0
  br i1 %16, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret i8 0

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %17 = load ptr, ptr %heap, align 1
  store ptr %17, ptr %"control value 9.6", align 1
  %18 = load ptr, ptr %"control value 9.6", align 1
  %19 = getelementptr i8, ptr %18, i32 8
  store ptr %19, ptr %"control value 9.7", align 1
  %20 = load i32, ptr %limit, align 1
  store i32 %20, ptr %"control value 9.8", align 1
  %21 = load ptr, ptr %"control value 9.7", align 1
  %22 = load i32, ptr %"control value 9.8", align 1
  store i32 %22, ptr %21, align 1
  ret i8 1
}

define internal i32 @tower.fn.guest_heap_request_size(i32 %0, i32 %1) {
entry:
  %count = alloca i32, align 4
  %size = alloca i32, align 4
  %maximum = alloca i32, align 4
  %limit = alloca i32, align 4
  %overflow = alloca i8, align 1
  %bytes = alloca i32, align 4
  %limit1 = alloca i32, align 4
  %overflow2 = alloca i8, align 1
  %"control value 10.0" = alloca ptr, align 4
  %"control value 10.1" = alloca i32, align 4
  %"control value 10.2" = alloca i32, align 4
  %"control value 10.3" = alloca i32, align 4
  %"control value 10.4" = alloca i8, align 1
  %"control value 10.5" = alloca i32, align 4
  %"control value 10.6" = alloca i32, align 4
  %"control value 10.7" = alloca i32, align 4
  %"control value 10.8" = alloca i32, align 4
  %"control value 10.9" = alloca i32, align 4
  %"control value 10.10" = alloca i8, align 1
  %"control value 10.11" = alloca i8, align 1
  %"control value 10.12" = alloca i32, align 4
  %"control value 10.13" = alloca i32, align 4
  %"control value 10.14" = alloca i32, align 4
  %"control value 10.15" = alloca i32, align 4
  %"control value 10.16" = alloca i32, align 4
  %"control value 10.17" = alloca i32, align 4
  %"control value 10.18" = alloca i32, align 4
  %"control value 10.19" = alloca i8, align 1
  %"control value 10.20" = alloca i8, align 1
  %"control value 10.21" = alloca ptr, align 4
  %"control value 10.22" = alloca i32, align 4
  %"control value 10.23" = alloca i32, align 4
  %"control value 10.24" = alloca ptr, align 4
  %"control value 10.25" = alloca i32, align 4
  %"control value 10.26" = alloca i32, align 4
  %"control value 10.27" = alloca ptr, align 4
  %"control value 10.28" = alloca i32, align 4
  %"control value 10.29" = alloca i32, align 4
  %"control value 10.30" = alloca i32, align 4
  %"control value 10.31" = alloca i8, align 1
  %"control value 10.32" = alloca ptr, align 4
  %"control value 10.33" = alloca i32, align 4
  store i32 %0, ptr %count, align 1
  store i32 %1, ptr %size, align 1
  store i32 0, ptr %maximum, align 1
  store ptr %maximum, ptr %"control value 10.0", align 1
  %2 = load ptr, ptr %"control value 10.0", align 1
  %3 = load i32, ptr %2, align 1
  store i32 %3, ptr %"control value 10.1", align 1
  %4 = load i32, ptr %"control value 10.1", align 1
  %5 = sub i32 %4, 1
  store i32 %5, ptr %"control value 10.2", align 1
  %6 = load ptr, ptr %"control value 10.0", align 1
  %7 = load i32, ptr %"control value 10.2", align 1
  store i32 %7, ptr %6, align 1
  %8 = load i32, ptr %size, align 1
  store i32 %8, ptr %"control value 10.3", align 1
  %9 = load i32, ptr %"control value 10.3", align 1
  %10 = icmp ne i32 %9, 0
  %11 = zext i1 %10 to i8
  store i8 %11, ptr %"control value 10.4", align 1
  %12 = load i8, ptr %"control value 10.4", align 1
  %13 = icmp ne i8 %12, 0
  br i1 %13, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %14 = load i32, ptr %maximum, align 1
  store i32 %14, ptr %"control value 10.5", align 1
  %15 = load i32, ptr %size, align 1
  store i32 %15, ptr %"control value 10.6", align 1
  %16 = load i32, ptr %"control value 10.5", align 1
  %17 = load i32, ptr %"control value 10.6", align 1
  %18 = icmp ne i32 %17, 0
  br i1 %18, label %valid, label %error

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.end5, %if.else
  %19 = load i32, ptr %count, align 1
  store i32 %19, ptr %"control value 10.12", align 1
  %20 = load i32, ptr %size, align 1
  store i32 %20, ptr %"control value 10.13", align 1
  %21 = load i32, ptr %"control value 10.12", align 1
  %22 = load i32, ptr %"control value 10.13", align 1
  %23 = mul i32 %21, %22
  store i32 %23, ptr %"control value 10.14", align 1
  %24 = load i32, ptr %"control value 10.14", align 1
  store i32 %24, ptr %bytes, align 1
  %25 = load i32, ptr %maximum, align 1
  store i32 %25, ptr %"control value 10.15", align 1
  %26 = load i32, ptr %"control value 10.15", align 1
  %27 = sub i32 %26, 15
  store i32 %27, ptr %"control value 10.16", align 1
  %28 = load i32, ptr %"control value 10.16", align 1
  store i32 %28, ptr %limit1, align 1
  %29 = load i32, ptr %bytes, align 1
  store i32 %29, ptr %"control value 10.17", align 1
  %30 = load i32, ptr %limit1, align 1
  store i32 %30, ptr %"control value 10.18", align 1
  %31 = load i32, ptr %"control value 10.17", align 1
  %32 = load i32, ptr %"control value 10.18", align 1
  %33 = icmp ugt i32 %31, %32
  %34 = zext i1 %33 to i8
  store i8 %34, ptr %"control value 10.19", align 1
  %35 = load i8, ptr %"control value 10.19", align 1
  store i8 %35, ptr %overflow2, align 1
  %36 = load i8, ptr %overflow2, align 1
  store i8 %36, ptr %"control value 10.20", align 1
  %37 = load i8, ptr %"control value 10.20", align 1
  %38 = icmp ne i8 %37, 0
  br i1 %38, label %if.body6, label %if.else7

valid:                                            ; preds = %if.body
  %39 = udiv i32 %16, %17
  store i32 %39, ptr %"control value 10.7", align 1
  %40 = load i32, ptr %"control value 10.7", align 1
  store i32 %40, ptr %limit, align 1
  %41 = load i32, ptr %count, align 1
  store i32 %41, ptr %"control value 10.8", align 1
  %42 = load i32, ptr %limit, align 1
  store i32 %42, ptr %"control value 10.9", align 1
  %43 = load i32, ptr %"control value 10.8", align 1
  %44 = load i32, ptr %"control value 10.9", align 1
  %45 = icmp ugt i32 %43, %44
  %46 = zext i1 %45 to i8
  store i8 %46, ptr %"control value 10.10", align 1
  %47 = load i8, ptr %"control value 10.10", align 1
  store i8 %47, ptr %overflow, align 1
  %48 = load i8, ptr %overflow, align 1
  store i8 %48, ptr %"control value 10.11", align 1
  %49 = load i8, ptr %"control value 10.11", align 1
  %50 = icmp ne i8 %49, 0
  br i1 %50, label %if.body3, label %if.else4

error:                                            ; preds = %if.body
  call void @tower_trap(ptr @3, i32 17520)
  unreachable

if.body3:                                         ; preds = %valid
  ret i32 0

if.else4:                                         ; preds = %valid
  br label %if.end5

if.end5:                                          ; preds = %if.else4
  br label %if.end

if.body6:                                         ; preds = %if.end
  ret i32 0

if.else7:                                         ; preds = %if.end
  br label %if.end8

if.end8:                                          ; preds = %if.else7
  store ptr %bytes, ptr %"control value 10.21", align 1
  %51 = load i32, ptr %bytes, align 1
  store i32 %51, ptr %"control value 10.22", align 1
  %52 = load i32, ptr %"control value 10.22", align 1
  %53 = add i32 %52, 15
  store i32 %53, ptr %"control value 10.23", align 1
  %54 = load ptr, ptr %"control value 10.21", align 1
  %55 = load i32, ptr %"control value 10.23", align 1
  store i32 %55, ptr %54, align 1
  store ptr %bytes, ptr %"control value 10.24", align 1
  %56 = load i32, ptr %bytes, align 1
  store i32 %56, ptr %"control value 10.25", align 1
  %57 = load i32, ptr %"control value 10.25", align 1
  br i1 true, label %valid9, label %error10

valid9:                                           ; preds = %if.end8
  %58 = udiv i32 %57, 16
  store i32 %58, ptr %"control value 10.26", align 1
  %59 = load ptr, ptr %"control value 10.24", align 1
  %60 = load i32, ptr %"control value 10.26", align 1
  store i32 %60, ptr %59, align 1
  store ptr %bytes, ptr %"control value 10.27", align 1
  %61 = load i32, ptr %bytes, align 1
  store i32 %61, ptr %"control value 10.28", align 1
  %62 = load i32, ptr %"control value 10.28", align 1
  %63 = mul i32 %62, 16
  store i32 %63, ptr %"control value 10.29", align 1
  %64 = load ptr, ptr %"control value 10.27", align 1
  %65 = load i32, ptr %"control value 10.29", align 1
  store i32 %65, ptr %64, align 1
  %66 = load i32, ptr %bytes, align 1
  store i32 %66, ptr %"control value 10.30", align 1
  %67 = load i32, ptr %"control value 10.30", align 1
  %68 = icmp eq i32 %67, 0
  %69 = zext i1 %68 to i8
  store i8 %69, ptr %"control value 10.31", align 1
  %70 = load i8, ptr %"control value 10.31", align 1
  %71 = icmp ne i8 %70, 0
  br i1 %71, label %if.body11, label %if.else12

error10:                                          ; preds = %if.end8
  call void @tower_trap(ptr @4, i32 17520)
  unreachable

if.body11:                                        ; preds = %valid9
  store ptr %bytes, ptr %"control value 10.32", align 1
  %72 = load ptr, ptr %"control value 10.32", align 1
  store i32 16, ptr %72, align 1
  br label %if.end13

if.else12:                                        ; preds = %valid9
  br label %if.end13

if.end13:                                         ; preds = %if.else12, %if.body11
  %73 = load i32, ptr %bytes, align 1
  store i32 %73, ptr %"control value 10.33", align 1
  %74 = load i32, ptr %"control value 10.33", align 1
  ret i32 %74
}

define ptr @guest_heap_allocate(ptr %0, i32 %1, i32 %2) {
entry:
  %heap = alloca ptr, align 4
  %count = alloca i32, align 4
  %size = alloca i32, align 4
  %bytes = alloca i32, align 4
  %link = alloca ptr, align 4
  %block = alloca ptr, align 4
  %spare = alloca i32, align 4
  %data = alloca ptr, align 4
  %remainder = alloca ptr, align 4
  %result = alloca ptr, align 4
  %remaining = alloca i32, align 4
  %block1 = alloca ptr, align 4
  %result2 = alloca ptr, align 4
  %"control value 11.0" = alloca i32, align 4
  %"control value 11.1" = alloca i32, align 4
  %"control value 11.2" = alloca i32, align 4
  %"control value 11.3" = alloca i32, align 4
  %"control value 11.4" = alloca i8, align 1
  %"control value 11.6" = alloca ptr, align 4
  %"control value 11.7" = alloca ptr, align 4
  %"control value 11.8" = alloca ptr, align 4
  %"control value 11.9" = alloca ptr, align 4
  %"control value 11.10" = alloca ptr, align 4
  %"control value 11.11" = alloca i8, align 1
  %"control value 11.12" = alloca ptr, align 4
  %"control value 11.13" = alloca i32, align 4
  %"control value 11.14" = alloca i32, align 4
  %"control value 11.15" = alloca i8, align 1
  %"control value 11.16" = alloca ptr, align 4
  %"control value 11.17" = alloca i32, align 4
  %"control value 11.18" = alloca i32, align 4
  %"control value 11.19" = alloca i32, align 4
  %"control value 11.22" = alloca i32, align 4
  %"control value 11.23" = alloca i32, align 4
  %"control value 11.24" = alloca i8, align 1
  %"control value 11.25" = alloca ptr, align 4
  %"control value 11.26" = alloca ptr, align 4
  %"control value 11.27" = alloca ptr, align 4
  %"control value 11.28" = alloca ptr, align 4
  %"control value 11.29" = alloca i32, align 4
  %"control value 11.30" = alloca ptr, align 4
  %"control value 11.31" = alloca ptr, align 4
  %"control value 11.32" = alloca ptr, align 4
  %"control value 11.33" = alloca i32, align 4
  %"control value 11.34" = alloca ptr, align 4
  %"control value 11.35" = alloca ptr, align 4
  %"control value 11.36" = alloca ptr, align 4
  %"control value 11.37" = alloca ptr, align 4
  %"control value 11.38" = alloca ptr, align 4
  %"control value 11.39" = alloca i32, align 4
  %"control value 11.40" = alloca i32, align 4
  %"control value 11.41" = alloca i32, align 4
  %"control value 11.42" = alloca ptr, align 4
  %"control value 11.43" = alloca ptr, align 4
  %"control value 11.44" = alloca ptr, align 4
  %"control value 11.45" = alloca ptr, align 4
  %"control value 11.46" = alloca ptr, align 4
  %"control value 11.47" = alloca ptr, align 4
  %"control value 11.48" = alloca ptr, align 4
  %"control value 11.49" = alloca ptr, align 4
  %"control value 11.50" = alloca i32, align 4
  %"control value 11.51" = alloca ptr, align 4
  %"control value 11.52" = alloca ptr, align 4
  %"control value 11.53" = alloca ptr, align 4
  %"control value 11.54" = alloca ptr, align 4
  %"control value 11.55" = alloca ptr, align 4
  %"control value 11.56" = alloca ptr, align 4
  %"control value 11.57" = alloca ptr, align 4
  %"control value 11.58" = alloca ptr, align 4
  %"control value 11.59" = alloca ptr, align 4
  %"control value 11.60" = alloca ptr, align 4
  %"control value 11.61" = alloca ptr, align 4
  %"control value 11.62" = alloca i32, align 4
  %"control value 11.63" = alloca ptr, align 4
  %"control value 11.64" = alloca i32, align 4
  %"control value 11.65" = alloca i32, align 4
  %"control value 11.66" = alloca i32, align 4
  %"control value 11.67" = alloca i32, align 4
  %"control value 11.68" = alloca i8, align 1
  %"control value 11.69" = alloca ptr, align 4
  %"control value 11.70" = alloca i32, align 4
  %"control value 11.71" = alloca i32, align 4
  %"control value 11.72" = alloca i32, align 4
  %"control value 11.73" = alloca i32, align 4
  %"control value 11.74" = alloca i32, align 4
  %"control value 11.75" = alloca i8, align 1
  %"control value 11.76" = alloca ptr, align 4
  %"control value 11.77" = alloca i32, align 4
  %"control value 11.78" = alloca ptr, align 4
  %"control value 11.79" = alloca ptr, align 4
  %"control value 11.80" = alloca ptr, align 4
  %"control value 11.81" = alloca i32, align 4
  %"control value 11.82" = alloca ptr, align 4
  %"control value 11.83" = alloca ptr, align 4
  %"control value 11.84" = alloca ptr, align 4
  %"control value 11.85" = alloca i32, align 4
  %"control value 11.86" = alloca i32, align 4
  %"control value 11.87" = alloca i32, align 4
  %"control value 11.88" = alloca ptr, align 4
  %"control value 11.89" = alloca ptr, align 4
  %"control value 11.90" = alloca ptr, align 4
  %"control value 11.91" = alloca i32, align 4
  %"control value 11.92" = alloca i32, align 4
  %"control value 11.93" = alloca i32, align 4
  %"control value 11.94" = alloca ptr, align 4
  %"control value 11.95" = alloca ptr, align 4
  %"control value 11.96" = alloca ptr, align 4
  %"control value 11.97" = alloca ptr, align 4
  store ptr %0, ptr %heap, align 1
  store i32 %1, ptr %count, align 1
  store i32 %2, ptr %size, align 1
  %3 = load i32, ptr %count, align 1
  store i32 %3, ptr %"control value 11.0", align 1
  %4 = load i32, ptr %size, align 1
  store i32 %4, ptr %"control value 11.1", align 1
  %5 = load i32, ptr %"control value 11.0", align 1
  %6 = load i32, ptr %"control value 11.1", align 1
  %7 = call i32 @tower.fn.guest_heap_request_size(i32 %5, i32 %6)
  store i32 %7, ptr %"control value 11.2", align 1
  %8 = load i32, ptr %"control value 11.2", align 1
  store i32 %8, ptr %bytes, align 1
  %9 = load i32, ptr %bytes, align 1
  store i32 %9, ptr %"control value 11.3", align 1
  %10 = load i32, ptr %"control value 11.3", align 1
  %11 = icmp eq i32 %10, 0
  %12 = zext i1 %11 to i8
  store i8 %12, ptr %"control value 11.4", align 1
  %13 = load i8, ptr %"control value 11.4", align 1
  %14 = icmp ne i8 %13, 0
  br i1 %14, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret ptr null

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %15 = load ptr, ptr %heap, align 1
  store ptr %15, ptr %"control value 11.6", align 1
  %16 = load ptr, ptr %"control value 11.6", align 1
  %17 = getelementptr i8, ptr %16, i32 0
  store ptr %17, ptr %"control value 11.7", align 1
  %18 = load ptr, ptr %"control value 11.7", align 1
  store ptr %18, ptr %link, align 1
  br label %loop

loop:                                             ; preds = %if.end8, %if.end
  %19 = load ptr, ptr %link, align 1
  store ptr %19, ptr %"control value 11.8", align 1
  %20 = load ptr, ptr %"control value 11.8", align 1
  %21 = load ptr, ptr %20, align 1
  store ptr %21, ptr %"control value 11.9", align 1
  %22 = load ptr, ptr %"control value 11.9", align 1
  store ptr %22, ptr %block, align 1
  %23 = load ptr, ptr %block, align 1
  store ptr %23, ptr %"control value 11.10", align 1
  %24 = load ptr, ptr %"control value 11.10", align 1
  %25 = icmp eq ptr %24, null
  %26 = zext i1 %25 to i8
  store i8 %26, ptr %"control value 11.11", align 1
  %27 = load i8, ptr %"control value 11.11", align 1
  %28 = icmp ne i8 %27, 0
  br i1 %28, label %if.body3, label %if.else4

loop.end:                                         ; preds = %if.body3
  %29 = load ptr, ptr %heap, align 1
  store ptr %29, ptr %"control value 11.61", align 1
  %30 = load ptr, ptr %"control value 11.61", align 1
  %31 = getelementptr i8, ptr %30, i32 8
  %32 = load i32, ptr %31, align 1
  store i32 %32, ptr %"control value 11.62", align 1
  %33 = load ptr, ptr %heap, align 1
  store ptr %33, ptr %"control value 11.63", align 1
  %34 = load ptr, ptr %"control value 11.63", align 1
  %35 = getelementptr i8, ptr %34, i32 4
  %36 = load i32, ptr %35, align 1
  store i32 %36, ptr %"control value 11.64", align 1
  %37 = load i32, ptr %"control value 11.62", align 1
  %38 = load i32, ptr %"control value 11.64", align 1
  %39 = sub i32 %37, %38
  store i32 %39, ptr %"control value 11.65", align 1
  %40 = load i32, ptr %"control value 11.65", align 1
  store i32 %40, ptr %remaining, align 1
  %41 = load i32, ptr %remaining, align 1
  store i32 %41, ptr %"control value 11.66", align 1
  store i32 16, ptr %"control value 11.67", align 1
  %42 = load i32, ptr %"control value 11.66", align 1
  %43 = load i32, ptr %"control value 11.67", align 1
  %44 = icmp ult i32 %42, %43
  %45 = zext i1 %44 to i8
  store i8 %45, ptr %"control value 11.68", align 1
  %46 = load i8, ptr %"control value 11.68", align 1
  %47 = icmp ne i8 %46, 0
  br i1 %47, label %if.body12, label %if.else13

if.body3:                                         ; preds = %loop
  br label %loop.end

if.else4:                                         ; preds = %loop
  br label %if.end5

if.end5:                                          ; preds = %if.else4
  %48 = load ptr, ptr %block, align 1
  store ptr %48, ptr %"control value 11.12", align 1
  %49 = load ptr, ptr %"control value 11.12", align 1
  %50 = getelementptr i8, ptr %49, i32 0
  %51 = load i32, ptr %50, align 1
  store i32 %51, ptr %"control value 11.13", align 1
  %52 = load i32, ptr %bytes, align 1
  store i32 %52, ptr %"control value 11.14", align 1
  %53 = load i32, ptr %"control value 11.13", align 1
  %54 = load i32, ptr %"control value 11.14", align 1
  %55 = icmp uge i32 %53, %54
  %56 = zext i1 %55 to i8
  store i8 %56, ptr %"control value 11.15", align 1
  %57 = load i8, ptr %"control value 11.15", align 1
  %58 = icmp ne i8 %57, 0
  br i1 %58, label %if.body6, label %if.else7

if.body6:                                         ; preds = %if.end5
  %59 = load ptr, ptr %block, align 1
  store ptr %59, ptr %"control value 11.16", align 1
  %60 = load ptr, ptr %"control value 11.16", align 1
  %61 = getelementptr i8, ptr %60, i32 0
  %62 = load i32, ptr %61, align 1
  store i32 %62, ptr %"control value 11.17", align 1
  %63 = load i32, ptr %bytes, align 1
  store i32 %63, ptr %"control value 11.18", align 1
  %64 = load i32, ptr %"control value 11.17", align 1
  %65 = load i32, ptr %"control value 11.18", align 1
  %66 = sub i32 %64, %65
  store i32 %66, ptr %"control value 11.19", align 1
  %67 = load i32, ptr %"control value 11.19", align 1
  store i32 %67, ptr %spare, align 1
  %68 = load i32, ptr %spare, align 1
  store i32 %68, ptr %"control value 11.22", align 1
  store i32 32, ptr %"control value 11.23", align 1
  %69 = load i32, ptr %"control value 11.22", align 1
  %70 = load i32, ptr %"control value 11.23", align 1
  %71 = icmp uge i32 %69, %70
  %72 = zext i1 %71 to i8
  store i8 %72, ptr %"control value 11.24", align 1
  %73 = load i8, ptr %"control value 11.24", align 1
  %74 = icmp ne i8 %73, 0
  br i1 %74, label %if.body9, label %if.else10

if.else7:                                         ; preds = %if.end5
  br label %if.end8

if.end8:                                          ; preds = %if.else7
  store ptr %link, ptr %"control value 11.58", align 1
  %75 = load ptr, ptr %block, align 1
  store ptr %75, ptr %"control value 11.59", align 1
  %76 = load ptr, ptr %"control value 11.59", align 1
  %77 = getelementptr i8, ptr %76, i32 4
  store ptr %77, ptr %"control value 11.60", align 1
  %78 = load ptr, ptr %"control value 11.58", align 1
  %79 = load ptr, ptr %"control value 11.60", align 1
  store ptr %79, ptr %78, align 1
  br label %loop

if.body9:                                         ; preds = %if.body6
  %80 = load ptr, ptr %block, align 1
  store ptr %80, ptr %"control value 11.25", align 1
  %81 = load ptr, ptr %"control value 11.25", align 1
  store ptr %81, ptr %"control value 11.26", align 1
  %82 = load ptr, ptr %"control value 11.26", align 1
  store ptr %82, ptr %data, align 1
  store ptr %data, ptr %"control value 11.27", align 1
  %83 = load ptr, ptr %data, align 1
  store ptr %83, ptr %"control value 11.28", align 1
  store i32 16, ptr %"control value 11.29", align 1
  %84 = load ptr, ptr %"control value 11.28", align 1
  %85 = load i32, ptr %"control value 11.29", align 1
  %86 = mul i32 %85, 1
  %87 = getelementptr i8, ptr %84, i32 %86
  store ptr %87, ptr %"control value 11.30", align 1
  %88 = load ptr, ptr %"control value 11.27", align 1
  %89 = load ptr, ptr %"control value 11.30", align 1
  store ptr %89, ptr %88, align 1
  store ptr %data, ptr %"control value 11.31", align 1
  %90 = load ptr, ptr %data, align 1
  store ptr %90, ptr %"control value 11.32", align 1
  %91 = load i32, ptr %bytes, align 1
  store i32 %91, ptr %"control value 11.33", align 1
  %92 = load ptr, ptr %"control value 11.32", align 1
  %93 = load i32, ptr %"control value 11.33", align 1
  %94 = mul i32 %93, 1
  %95 = getelementptr i8, ptr %92, i32 %94
  store ptr %95, ptr %"control value 11.34", align 1
  %96 = load ptr, ptr %"control value 11.31", align 1
  %97 = load ptr, ptr %"control value 11.34", align 1
  store ptr %97, ptr %96, align 1
  %98 = load ptr, ptr %data, align 1
  store ptr %98, ptr %"control value 11.35", align 1
  %99 = load ptr, ptr %"control value 11.35", align 1
  store ptr %99, ptr %"control value 11.36", align 1
  %100 = load ptr, ptr %"control value 11.36", align 1
  store ptr %100, ptr %remainder, align 1
  %101 = load ptr, ptr %remainder, align 1
  store ptr %101, ptr %"control value 11.37", align 1
  %102 = load ptr, ptr %"control value 11.37", align 1
  %103 = getelementptr i8, ptr %102, i32 0
  store ptr %103, ptr %"control value 11.38", align 1
  %104 = load i32, ptr %spare, align 1
  store i32 %104, ptr %"control value 11.39", align 1
  store i32 16, ptr %"control value 11.40", align 1
  %105 = load i32, ptr %"control value 11.39", align 1
  %106 = load i32, ptr %"control value 11.40", align 1
  %107 = sub i32 %105, %106
  store i32 %107, ptr %"control value 11.41", align 1
  %108 = load ptr, ptr %"control value 11.38", align 1
  %109 = load i32, ptr %"control value 11.41", align 1
  store i32 %109, ptr %108, align 1
  %110 = load ptr, ptr %remainder, align 1
  store ptr %110, ptr %"control value 11.42", align 1
  %111 = load ptr, ptr %"control value 11.42", align 1
  %112 = getelementptr i8, ptr %111, i32 4
  store ptr %112, ptr %"control value 11.43", align 1
  %113 = load ptr, ptr %block, align 1
  store ptr %113, ptr %"control value 11.44", align 1
  %114 = load ptr, ptr %"control value 11.44", align 1
  %115 = getelementptr i8, ptr %114, i32 4
  %116 = load ptr, ptr %115, align 1
  store ptr %116, ptr %"control value 11.45", align 1
  %117 = load ptr, ptr %"control value 11.43", align 1
  %118 = load ptr, ptr %"control value 11.45", align 1
  store ptr %118, ptr %117, align 1
  %119 = load ptr, ptr %link, align 1
  store ptr %119, ptr %"control value 11.46", align 1
  %120 = load ptr, ptr %remainder, align 1
  store ptr %120, ptr %"control value 11.47", align 1
  %121 = load ptr, ptr %"control value 11.46", align 1
  %122 = load ptr, ptr %"control value 11.47", align 1
  store ptr %122, ptr %121, align 1
  %123 = load ptr, ptr %block, align 1
  store ptr %123, ptr %"control value 11.48", align 1
  %124 = load ptr, ptr %"control value 11.48", align 1
  %125 = getelementptr i8, ptr %124, i32 0
  store ptr %125, ptr %"control value 11.49", align 1
  %126 = load i32, ptr %bytes, align 1
  store i32 %126, ptr %"control value 11.50", align 1
  %127 = load ptr, ptr %"control value 11.49", align 1
  %128 = load i32, ptr %"control value 11.50", align 1
  store i32 %128, ptr %127, align 1
  br label %if.end11

if.else10:                                        ; preds = %if.body6
  %129 = load ptr, ptr %link, align 1
  store ptr %129, ptr %"control value 11.51", align 1
  %130 = load ptr, ptr %block, align 1
  store ptr %130, ptr %"control value 11.52", align 1
  %131 = load ptr, ptr %"control value 11.52", align 1
  %132 = getelementptr i8, ptr %131, i32 4
  %133 = load ptr, ptr %132, align 1
  store ptr %133, ptr %"control value 11.53", align 1
  %134 = load ptr, ptr %"control value 11.51", align 1
  %135 = load ptr, ptr %"control value 11.53", align 1
  store ptr %135, ptr %134, align 1
  br label %if.end11

if.end11:                                         ; preds = %if.else10, %if.body9
  %136 = load ptr, ptr %block, align 1
  store ptr %136, ptr %"control value 11.54", align 1
  %137 = load ptr, ptr %"control value 11.54", align 1
  %138 = getelementptr i8, ptr %137, i32 16
  store ptr %138, ptr %"control value 11.55", align 1
  %139 = load ptr, ptr %"control value 11.55", align 1
  store ptr %139, ptr %result, align 1
  %140 = load ptr, ptr %result, align 1
  store ptr %140, ptr %"control value 11.56", align 1
  %141 = load ptr, ptr %"control value 11.56", align 1
  store ptr %141, ptr %"control value 11.57", align 1
  %142 = load ptr, ptr %"control value 11.57", align 1
  ret ptr %142

if.body12:                                        ; preds = %loop.end
  ret ptr null

if.else13:                                        ; preds = %loop.end
  br label %if.end14

if.end14:                                         ; preds = %if.else13
  store ptr %remaining, ptr %"control value 11.69", align 1
  %143 = load i32, ptr %remaining, align 1
  store i32 %143, ptr %"control value 11.70", align 1
  store i32 16, ptr %"control value 11.71", align 1
  %144 = load i32, ptr %"control value 11.70", align 1
  %145 = load i32, ptr %"control value 11.71", align 1
  %146 = sub i32 %144, %145
  store i32 %146, ptr %"control value 11.72", align 1
  %147 = load ptr, ptr %"control value 11.69", align 1
  %148 = load i32, ptr %"control value 11.72", align 1
  store i32 %148, ptr %147, align 1
  %149 = load i32, ptr %remaining, align 1
  store i32 %149, ptr %"control value 11.73", align 1
  %150 = load i32, ptr %bytes, align 1
  store i32 %150, ptr %"control value 11.74", align 1
  %151 = load i32, ptr %"control value 11.73", align 1
  %152 = load i32, ptr %"control value 11.74", align 1
  %153 = icmp ult i32 %151, %152
  %154 = zext i1 %153 to i8
  store i8 %154, ptr %"control value 11.75", align 1
  %155 = load i8, ptr %"control value 11.75", align 1
  %156 = icmp ne i8 %155, 0
  br i1 %156, label %if.body15, label %if.else16

if.body15:                                        ; preds = %if.end14
  ret ptr null

if.else16:                                        ; preds = %if.end14
  br label %if.end17

if.end17:                                         ; preds = %if.else16
  %157 = load ptr, ptr %heap, align 1
  store ptr %157, ptr %"control value 11.76", align 1
  %158 = load ptr, ptr %"control value 11.76", align 1
  %159 = getelementptr i8, ptr %158, i32 4
  %160 = load i32, ptr %159, align 1
  store i32 %160, ptr %"control value 11.77", align 1
  %161 = load i32, ptr %"control value 11.77", align 1
  %162 = inttoptr i32 %161 to ptr
  store ptr %162, ptr %"control value 11.78", align 1
  %163 = load ptr, ptr %"control value 11.78", align 1
  store ptr %163, ptr %block1, align 1
  %164 = load ptr, ptr %block1, align 1
  store ptr %164, ptr %"control value 11.79", align 1
  %165 = load ptr, ptr %"control value 11.79", align 1
  %166 = getelementptr i8, ptr %165, i32 0
  store ptr %166, ptr %"control value 11.80", align 1
  %167 = load i32, ptr %bytes, align 1
  store i32 %167, ptr %"control value 11.81", align 1
  %168 = load ptr, ptr %"control value 11.80", align 1
  %169 = load i32, ptr %"control value 11.81", align 1
  store i32 %169, ptr %168, align 1
  %170 = load ptr, ptr %heap, align 1
  store ptr %170, ptr %"control value 11.82", align 1
  %171 = load ptr, ptr %"control value 11.82", align 1
  %172 = getelementptr i8, ptr %171, i32 4
  store ptr %172, ptr %"control value 11.83", align 1
  %173 = load ptr, ptr %heap, align 1
  store ptr %173, ptr %"control value 11.84", align 1
  %174 = load ptr, ptr %"control value 11.84", align 1
  %175 = getelementptr i8, ptr %174, i32 4
  %176 = load i32, ptr %175, align 1
  store i32 %176, ptr %"control value 11.85", align 1
  store i32 16, ptr %"control value 11.86", align 1
  %177 = load i32, ptr %"control value 11.85", align 1
  %178 = load i32, ptr %"control value 11.86", align 1
  %179 = add i32 %177, %178
  store i32 %179, ptr %"control value 11.87", align 1
  %180 = load ptr, ptr %"control value 11.83", align 1
  %181 = load i32, ptr %"control value 11.87", align 1
  store i32 %181, ptr %180, align 1
  %182 = load ptr, ptr %heap, align 1
  store ptr %182, ptr %"control value 11.88", align 1
  %183 = load ptr, ptr %"control value 11.88", align 1
  %184 = getelementptr i8, ptr %183, i32 4
  store ptr %184, ptr %"control value 11.89", align 1
  %185 = load ptr, ptr %heap, align 1
  store ptr %185, ptr %"control value 11.90", align 1
  %186 = load ptr, ptr %"control value 11.90", align 1
  %187 = getelementptr i8, ptr %186, i32 4
  %188 = load i32, ptr %187, align 1
  store i32 %188, ptr %"control value 11.91", align 1
  %189 = load i32, ptr %bytes, align 1
  store i32 %189, ptr %"control value 11.92", align 1
  %190 = load i32, ptr %"control value 11.91", align 1
  %191 = load i32, ptr %"control value 11.92", align 1
  %192 = add i32 %190, %191
  store i32 %192, ptr %"control value 11.93", align 1
  %193 = load ptr, ptr %"control value 11.89", align 1
  %194 = load i32, ptr %"control value 11.93", align 1
  store i32 %194, ptr %193, align 1
  %195 = load ptr, ptr %block1, align 1
  store ptr %195, ptr %"control value 11.94", align 1
  %196 = load ptr, ptr %"control value 11.94", align 1
  %197 = getelementptr i8, ptr %196, i32 16
  store ptr %197, ptr %"control value 11.95", align 1
  %198 = load ptr, ptr %"control value 11.95", align 1
  store ptr %198, ptr %result2, align 1
  %199 = load ptr, ptr %result2, align 1
  store ptr %199, ptr %"control value 11.96", align 1
  %200 = load ptr, ptr %"control value 11.96", align 1
  store ptr %200, ptr %"control value 11.97", align 1
  %201 = load ptr, ptr %"control value 11.97", align 1
  ret ptr %201
}

define internal void @tower.fn.guest_heap_merge(ptr %0) {
entry:
  %block = alloca ptr, align 4
  %next = alloca ptr, align 4
  %data = alloca ptr, align 4
  %end = alloca ptr, align 4
  %"control value 12.0" = alloca ptr, align 4
  %"control value 12.1" = alloca ptr, align 4
  %"control value 12.2" = alloca ptr, align 4
  %"control value 12.3" = alloca i8, align 1
  %"control value 12.4" = alloca ptr, align 4
  %"control value 12.5" = alloca ptr, align 4
  %"control value 12.6" = alloca ptr, align 4
  %"control value 12.7" = alloca ptr, align 4
  %"control value 12.8" = alloca ptr, align 4
  %"control value 12.9" = alloca ptr, align 4
  %"control value 12.10" = alloca ptr, align 4
  %"control value 12.11" = alloca i32, align 4
  %"control value 12.12" = alloca ptr, align 4
  %"control value 12.13" = alloca ptr, align 4
  %"control value 12.14" = alloca ptr, align 4
  %"control value 12.15" = alloca ptr, align 4
  %"control value 12.16" = alloca i8, align 1
  %"control value 12.17" = alloca ptr, align 4
  %"control value 12.18" = alloca ptr, align 4
  %"control value 12.19" = alloca ptr, align 4
  %"control value 12.20" = alloca i32, align 4
  %"control value 12.21" = alloca i32, align 4
  %"control value 12.22" = alloca i32, align 4
  %"control value 12.23" = alloca ptr, align 4
  %"control value 12.24" = alloca ptr, align 4
  %"control value 12.25" = alloca ptr, align 4
  %"control value 12.26" = alloca i32, align 4
  %"control value 12.27" = alloca ptr, align 4
  %"control value 12.28" = alloca i32, align 4
  %"control value 12.29" = alloca i32, align 4
  %"control value 12.30" = alloca ptr, align 4
  %"control value 12.31" = alloca ptr, align 4
  %"control value 12.32" = alloca ptr, align 4
  %"control value 12.33" = alloca ptr, align 4
  store ptr %0, ptr %block, align 1
  %1 = load ptr, ptr %block, align 1
  store ptr %1, ptr %"control value 12.0", align 1
  %2 = load ptr, ptr %"control value 12.0", align 1
  %3 = getelementptr i8, ptr %2, i32 4
  %4 = load ptr, ptr %3, align 1
  store ptr %4, ptr %"control value 12.1", align 1
  %5 = load ptr, ptr %"control value 12.1", align 1
  store ptr %5, ptr %next, align 1
  %6 = load ptr, ptr %next, align 1
  store ptr %6, ptr %"control value 12.2", align 1
  %7 = load ptr, ptr %"control value 12.2", align 1
  %8 = icmp ne ptr %7, null
  %9 = zext i1 %8 to i8
  store i8 %9, ptr %"control value 12.3", align 1
  %10 = load i8, ptr %"control value 12.3", align 1
  %11 = icmp ne i8 %10, 0
  br i1 %11, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %12 = load ptr, ptr %block, align 1
  store ptr %12, ptr %"control value 12.4", align 1
  %13 = load ptr, ptr %"control value 12.4", align 1
  %14 = getelementptr i8, ptr %13, i32 16
  store ptr %14, ptr %"control value 12.5", align 1
  %15 = load ptr, ptr %"control value 12.5", align 1
  store ptr %15, ptr %data, align 1
  %16 = load ptr, ptr %data, align 1
  store ptr %16, ptr %"control value 12.6", align 1
  %17 = load ptr, ptr %"control value 12.6", align 1
  store ptr %17, ptr %"control value 12.7", align 1
  %18 = load ptr, ptr %"control value 12.7", align 1
  store ptr %18, ptr %end, align 1
  store ptr %end, ptr %"control value 12.8", align 1
  %19 = load ptr, ptr %end, align 1
  store ptr %19, ptr %"control value 12.9", align 1
  %20 = load ptr, ptr %block, align 1
  store ptr %20, ptr %"control value 12.10", align 1
  %21 = load ptr, ptr %"control value 12.10", align 1
  %22 = getelementptr i8, ptr %21, i32 0
  %23 = load i32, ptr %22, align 1
  store i32 %23, ptr %"control value 12.11", align 1
  %24 = load ptr, ptr %"control value 12.9", align 1
  %25 = load i32, ptr %"control value 12.11", align 1
  %26 = mul i32 %25, 1
  %27 = getelementptr i8, ptr %24, i32 %26
  store ptr %27, ptr %"control value 12.12", align 1
  %28 = load ptr, ptr %"control value 12.8", align 1
  %29 = load ptr, ptr %"control value 12.12", align 1
  store ptr %29, ptr %28, align 1
  %30 = load ptr, ptr %end, align 1
  store ptr %30, ptr %"control value 12.13", align 1
  %31 = load ptr, ptr %next, align 1
  store ptr %31, ptr %"control value 12.14", align 1
  %32 = load ptr, ptr %"control value 12.14", align 1
  store ptr %32, ptr %"control value 12.15", align 1
  %33 = load ptr, ptr %"control value 12.13", align 1
  %34 = load ptr, ptr %"control value 12.15", align 1
  %35 = icmp eq ptr %33, %34
  %36 = zext i1 %35 to i8
  store i8 %36, ptr %"control value 12.16", align 1
  %37 = load i8, ptr %"control value 12.16", align 1
  %38 = icmp ne i8 %37, 0
  br i1 %38, label %if.body1, label %if.else2

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.end3, %if.else
  ret void

if.body1:                                         ; preds = %if.body
  %39 = load ptr, ptr %block, align 1
  store ptr %39, ptr %"control value 12.17", align 1
  %40 = load ptr, ptr %"control value 12.17", align 1
  %41 = getelementptr i8, ptr %40, i32 0
  store ptr %41, ptr %"control value 12.18", align 1
  %42 = load ptr, ptr %block, align 1
  store ptr %42, ptr %"control value 12.19", align 1
  %43 = load ptr, ptr %"control value 12.19", align 1
  %44 = getelementptr i8, ptr %43, i32 0
  %45 = load i32, ptr %44, align 1
  store i32 %45, ptr %"control value 12.20", align 1
  store i32 16, ptr %"control value 12.21", align 1
  %46 = load i32, ptr %"control value 12.20", align 1
  %47 = load i32, ptr %"control value 12.21", align 1
  %48 = add i32 %46, %47
  store i32 %48, ptr %"control value 12.22", align 1
  %49 = load ptr, ptr %"control value 12.18", align 1
  %50 = load i32, ptr %"control value 12.22", align 1
  store i32 %50, ptr %49, align 1
  %51 = load ptr, ptr %block, align 1
  store ptr %51, ptr %"control value 12.23", align 1
  %52 = load ptr, ptr %"control value 12.23", align 1
  %53 = getelementptr i8, ptr %52, i32 0
  store ptr %53, ptr %"control value 12.24", align 1
  %54 = load ptr, ptr %block, align 1
  store ptr %54, ptr %"control value 12.25", align 1
  %55 = load ptr, ptr %"control value 12.25", align 1
  %56 = getelementptr i8, ptr %55, i32 0
  %57 = load i32, ptr %56, align 1
  store i32 %57, ptr %"control value 12.26", align 1
  %58 = load ptr, ptr %next, align 1
  store ptr %58, ptr %"control value 12.27", align 1
  %59 = load ptr, ptr %"control value 12.27", align 1
  %60 = getelementptr i8, ptr %59, i32 0
  %61 = load i32, ptr %60, align 1
  store i32 %61, ptr %"control value 12.28", align 1
  %62 = load i32, ptr %"control value 12.26", align 1
  %63 = load i32, ptr %"control value 12.28", align 1
  %64 = add i32 %62, %63
  store i32 %64, ptr %"control value 12.29", align 1
  %65 = load ptr, ptr %"control value 12.24", align 1
  %66 = load i32, ptr %"control value 12.29", align 1
  store i32 %66, ptr %65, align 1
  %67 = load ptr, ptr %block, align 1
  store ptr %67, ptr %"control value 12.30", align 1
  %68 = load ptr, ptr %"control value 12.30", align 1
  %69 = getelementptr i8, ptr %68, i32 4
  store ptr %69, ptr %"control value 12.31", align 1
  %70 = load ptr, ptr %next, align 1
  store ptr %70, ptr %"control value 12.32", align 1
  %71 = load ptr, ptr %"control value 12.32", align 1
  %72 = getelementptr i8, ptr %71, i32 4
  %73 = load ptr, ptr %72, align 1
  store ptr %73, ptr %"control value 12.33", align 1
  %74 = load ptr, ptr %"control value 12.31", align 1
  %75 = load ptr, ptr %"control value 12.33", align 1
  store ptr %75, ptr %74, align 1
  br label %if.end3

if.else2:                                         ; preds = %if.body
  br label %if.end3

if.end3:                                          ; preds = %if.else2, %if.body1
  br label %if.end
}

define void @guest_heap_free(ptr %0, ptr %1) {
entry:
  %heap = alloca ptr, align 4
  %pointer = alloca ptr, align 4
  %absent = alloca i8, align 1
  %block = alloca ptr, align 4
  %address = alloca i32, align 4
  %previous = alloca ptr, align 4
  %link = alloca ptr, align 4
  %previous_link = alloca ptr, align 4
  %next = alloca ptr, align 4
  %data = alloca ptr, align 4
  %previous_end = alloca ptr, align 4
  %adjacent = alloca i8, align 1
  %data1 = alloca ptr, align 4
  %end = alloca i32, align 4
  %"control value 13.0" = alloca ptr, align 4
  %"control value 13.1" = alloca i8, align 1
  %"control value 13.2" = alloca i8, align 1
  %"control value 13.3" = alloca ptr, align 4
  %"control value 13.4" = alloca ptr, align 4
  %"control value 13.5" = alloca ptr, align 4
  %"control value 13.6" = alloca ptr, align 4
  %"control value 13.7" = alloca ptr, align 4
  %"control value 13.8" = alloca ptr, align 4
  %"control value 13.9" = alloca i32, align 4
  %"control value 13.10" = alloca ptr, align 4
  %"control value 13.11" = alloca ptr, align 4
  %"control value 13.12" = alloca ptr, align 4
  %"control value 13.13" = alloca ptr, align 4
  %"control value 13.14" = alloca ptr, align 4
  %"control value 13.15" = alloca ptr, align 4
  %"control value 13.16" = alloca ptr, align 4
  %"control value 13.17" = alloca i8, align 1
  %"control value 13.18" = alloca i8, align 1
  %"control value 13.19" = alloca ptr, align 4
  %"control value 13.20" = alloca i32, align 4
  %"control value 13.21" = alloca i32, align 4
  %"control value 13.22" = alloca i8, align 1
  %"control value 13.23" = alloca ptr, align 4
  %"control value 13.24" = alloca ptr, align 4
  %"control value 13.25" = alloca ptr, align 4
  %"control value 13.26" = alloca ptr, align 4
  %"control value 13.27" = alloca ptr, align 4
  %"control value 13.28" = alloca ptr, align 4
  %"control value 13.29" = alloca ptr, align 4
  %"control value 13.30" = alloca ptr, align 4
  %"control value 13.31" = alloca ptr, align 4
  %"control value 13.32" = alloca ptr, align 4
  %"control value 13.33" = alloca ptr, align 4
  %"control value 13.34" = alloca ptr, align 4
  %"control value 13.35" = alloca ptr, align 4
  %"control value 13.36" = alloca ptr, align 4
  %"control value 13.37" = alloca ptr, align 4
  %"control value 13.38" = alloca i8, align 1
  %"control value 13.39" = alloca ptr, align 4
  %"control value 13.40" = alloca ptr, align 4
  %"control value 13.41" = alloca ptr, align 4
  %"control value 13.42" = alloca ptr, align 4
  %"control value 13.43" = alloca ptr, align 4
  %"control value 13.44" = alloca ptr, align 4
  %"control value 13.45" = alloca ptr, align 4
  %"control value 13.46" = alloca i32, align 4
  %"control value 13.47" = alloca ptr, align 4
  %"control value 13.48" = alloca ptr, align 4
  %"control value 13.49" = alloca ptr, align 4
  %"control value 13.50" = alloca ptr, align 4
  %"control value 13.51" = alloca i8, align 1
  %"control value 13.52" = alloca ptr, align 4
  %"control value 13.53" = alloca i8, align 1
  %"control value 13.54" = alloca ptr, align 4
  %"control value 13.55" = alloca ptr, align 4
  %"control value 13.56" = alloca ptr, align 4
  %"control value 13.57" = alloca ptr, align 4
  %"control value 13.58" = alloca ptr, align 4
  %"control value 13.59" = alloca ptr, align 4
  %"control value 13.60" = alloca ptr, align 4
  %"control value 13.61" = alloca i32, align 4
  %"control value 13.62" = alloca ptr, align 4
  %"control value 13.63" = alloca i32, align 4
  %"control value 13.64" = alloca i32, align 4
  %"control value 13.65" = alloca i32, align 4
  %"control value 13.66" = alloca ptr, align 4
  %"control value 13.67" = alloca i32, align 4
  %"control value 13.68" = alloca i8, align 1
  %"control value 13.69" = alloca ptr, align 4
  %"control value 13.70" = alloca ptr, align 4
  %"control value 13.71" = alloca ptr, align 4
  %"control value 13.72" = alloca i32, align 4
  %"control value 13.73" = alloca ptr, align 4
  %"control value 13.74" = alloca ptr, align 4
  %"control value 13.75" = alloca ptr, align 4
  store ptr %0, ptr %heap, align 1
  store ptr %1, ptr %pointer, align 1
  %2 = load ptr, ptr %pointer, align 1
  store ptr %2, ptr %"control value 13.0", align 1
  %3 = load ptr, ptr %"control value 13.0", align 1
  %4 = icmp eq ptr %3, null
  %5 = zext i1 %4 to i8
  store i8 %5, ptr %"control value 13.1", align 1
  %6 = load i8, ptr %"control value 13.1", align 1
  store i8 %6, ptr %absent, align 1
  %7 = load i8, ptr %absent, align 1
  store i8 %7, ptr %"control value 13.2", align 1
  %8 = load i8, ptr %"control value 13.2", align 1
  %9 = icmp ne i8 %8, 0
  br i1 %9, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret void

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %10 = load ptr, ptr %pointer, align 1
  store ptr %10, ptr %"control value 13.3", align 1
  %11 = load ptr, ptr %"control value 13.3", align 1
  store ptr %11, ptr %"control value 13.4", align 1
  %12 = load ptr, ptr %"control value 13.4", align 1
  store ptr %12, ptr %block, align 1
  store ptr %block, ptr %"control value 13.5", align 1
  %13 = load ptr, ptr %"control value 13.5", align 1
  %14 = load ptr, ptr %13, align 1
  store ptr %14, ptr %"control value 13.6", align 1
  %15 = load ptr, ptr %"control value 13.6", align 1
  %16 = getelementptr i8, ptr %15, i32 -16
  store ptr %16, ptr %"control value 13.7", align 1
  %17 = load ptr, ptr %"control value 13.5", align 1
  %18 = load ptr, ptr %"control value 13.7", align 1
  store ptr %18, ptr %17, align 1
  %19 = load ptr, ptr %block, align 1
  store ptr %19, ptr %"control value 13.8", align 1
  %20 = load ptr, ptr %"control value 13.8", align 1
  %21 = ptrtoint ptr %20 to i32
  store i32 %21, ptr %"control value 13.9", align 1
  %22 = load i32, ptr %"control value 13.9", align 1
  store i32 %22, ptr %address, align 1
  store ptr null, ptr %previous, align 1
  %23 = load ptr, ptr %heap, align 1
  store ptr %23, ptr %"control value 13.10", align 1
  %24 = load ptr, ptr %"control value 13.10", align 1
  %25 = getelementptr i8, ptr %24, i32 0
  store ptr %25, ptr %"control value 13.11", align 1
  %26 = load ptr, ptr %"control value 13.11", align 1
  store ptr %26, ptr %link, align 1
  %27 = load ptr, ptr %link, align 1
  store ptr %27, ptr %"control value 13.12", align 1
  %28 = load ptr, ptr %"control value 13.12", align 1
  store ptr %28, ptr %previous_link, align 1
  br label %loop

loop:                                             ; preds = %if.end7, %if.end
  %29 = load ptr, ptr %link, align 1
  store ptr %29, ptr %"control value 13.13", align 1
  %30 = load ptr, ptr %"control value 13.13", align 1
  %31 = load ptr, ptr %30, align 1
  store ptr %31, ptr %"control value 13.14", align 1
  %32 = load ptr, ptr %"control value 13.14", align 1
  store ptr %32, ptr %next, align 1
  store ptr %absent, ptr %"control value 13.15", align 1
  %33 = load ptr, ptr %next, align 1
  store ptr %33, ptr %"control value 13.16", align 1
  %34 = load ptr, ptr %"control value 13.16", align 1
  %35 = icmp eq ptr %34, null
  %36 = zext i1 %35 to i8
  store i8 %36, ptr %"control value 13.17", align 1
  %37 = load ptr, ptr %"control value 13.15", align 1
  %38 = load i8, ptr %"control value 13.17", align 1
  store i8 %38, ptr %37, align 1
  %39 = load i8, ptr %absent, align 1
  store i8 %39, ptr %"control value 13.18", align 1
  %40 = load i8, ptr %"control value 13.18", align 1
  %41 = icmp ne i8 %40, 0
  br i1 %41, label %if.body2, label %if.else3

loop.end:                                         ; preds = %if.body5, %if.body2
  %42 = load ptr, ptr %block, align 1
  store ptr %42, ptr %"control value 13.30", align 1
  %43 = load ptr, ptr %"control value 13.30", align 1
  %44 = getelementptr i8, ptr %43, i32 4
  store ptr %44, ptr %"control value 13.31", align 1
  %45 = load ptr, ptr %link, align 1
  store ptr %45, ptr %"control value 13.32", align 1
  %46 = load ptr, ptr %"control value 13.32", align 1
  %47 = load ptr, ptr %46, align 1
  store ptr %47, ptr %"control value 13.33", align 1
  %48 = load ptr, ptr %"control value 13.31", align 1
  %49 = load ptr, ptr %"control value 13.33", align 1
  store ptr %49, ptr %48, align 1
  %50 = load ptr, ptr %link, align 1
  store ptr %50, ptr %"control value 13.34", align 1
  %51 = load ptr, ptr %block, align 1
  store ptr %51, ptr %"control value 13.35", align 1
  %52 = load ptr, ptr %"control value 13.34", align 1
  %53 = load ptr, ptr %"control value 13.35", align 1
  store ptr %53, ptr %52, align 1
  %54 = load ptr, ptr %block, align 1
  store ptr %54, ptr %"control value 13.36", align 1
  %55 = load ptr, ptr %"control value 13.36", align 1
  call void @tower.fn.guest_heap_merge(ptr %55)
  %56 = load ptr, ptr %previous, align 1
  store ptr %56, ptr %"control value 13.37", align 1
  %57 = load ptr, ptr %"control value 13.37", align 1
  %58 = icmp ne ptr %57, null
  %59 = zext i1 %58 to i8
  store i8 %59, ptr %"control value 13.38", align 1
  %60 = load i8, ptr %"control value 13.38", align 1
  %61 = icmp ne i8 %60, 0
  br i1 %61, label %if.body8, label %if.else9

if.body2:                                         ; preds = %loop
  br label %loop.end

if.else3:                                         ; preds = %loop
  br label %if.end4

if.end4:                                          ; preds = %if.else3
  %62 = load ptr, ptr %next, align 1
  store ptr %62, ptr %"control value 13.19", align 1
  %63 = load ptr, ptr %"control value 13.19", align 1
  %64 = ptrtoint ptr %63 to i32
  store i32 %64, ptr %"control value 13.20", align 1
  %65 = load i32, ptr %address, align 1
  store i32 %65, ptr %"control value 13.21", align 1
  %66 = load i32, ptr %"control value 13.20", align 1
  %67 = load i32, ptr %"control value 13.21", align 1
  %68 = icmp uge i32 %66, %67
  %69 = zext i1 %68 to i8
  store i8 %69, ptr %"control value 13.22", align 1
  %70 = load i8, ptr %"control value 13.22", align 1
  %71 = icmp ne i8 %70, 0
  br i1 %71, label %if.body5, label %if.else6

if.body5:                                         ; preds = %if.end4
  br label %loop.end

if.else6:                                         ; preds = %if.end4
  br label %if.end7

if.end7:                                          ; preds = %if.else6
  store ptr %previous, ptr %"control value 13.23", align 1
  %72 = load ptr, ptr %next, align 1
  store ptr %72, ptr %"control value 13.24", align 1
  %73 = load ptr, ptr %"control value 13.23", align 1
  %74 = load ptr, ptr %"control value 13.24", align 1
  store ptr %74, ptr %73, align 1
  store ptr %previous_link, ptr %"control value 13.25", align 1
  %75 = load ptr, ptr %link, align 1
  store ptr %75, ptr %"control value 13.26", align 1
  %76 = load ptr, ptr %"control value 13.25", align 1
  %77 = load ptr, ptr %"control value 13.26", align 1
  store ptr %77, ptr %76, align 1
  store ptr %link, ptr %"control value 13.27", align 1
  %78 = load ptr, ptr %next, align 1
  store ptr %78, ptr %"control value 13.28", align 1
  %79 = load ptr, ptr %"control value 13.28", align 1
  %80 = getelementptr i8, ptr %79, i32 4
  store ptr %80, ptr %"control value 13.29", align 1
  %81 = load ptr, ptr %"control value 13.27", align 1
  %82 = load ptr, ptr %"control value 13.29", align 1
  store ptr %82, ptr %81, align 1
  br label %loop

if.body8:                                         ; preds = %loop.end
  %83 = load ptr, ptr %previous, align 1
  store ptr %83, ptr %"control value 13.39", align 1
  %84 = load ptr, ptr %"control value 13.39", align 1
  %85 = getelementptr i8, ptr %84, i32 16
  store ptr %85, ptr %"control value 13.40", align 1
  %86 = load ptr, ptr %"control value 13.40", align 1
  store ptr %86, ptr %data, align 1
  %87 = load ptr, ptr %data, align 1
  store ptr %87, ptr %"control value 13.41", align 1
  %88 = load ptr, ptr %"control value 13.41", align 1
  store ptr %88, ptr %"control value 13.42", align 1
  %89 = load ptr, ptr %"control value 13.42", align 1
  store ptr %89, ptr %previous_end, align 1
  store ptr %previous_end, ptr %"control value 13.43", align 1
  %90 = load ptr, ptr %previous_end, align 1
  store ptr %90, ptr %"control value 13.44", align 1
  %91 = load ptr, ptr %previous, align 1
  store ptr %91, ptr %"control value 13.45", align 1
  %92 = load ptr, ptr %"control value 13.45", align 1
  %93 = getelementptr i8, ptr %92, i32 0
  %94 = load i32, ptr %93, align 1
  store i32 %94, ptr %"control value 13.46", align 1
  %95 = load ptr, ptr %"control value 13.44", align 1
  %96 = load i32, ptr %"control value 13.46", align 1
  %97 = mul i32 %96, 1
  %98 = getelementptr i8, ptr %95, i32 %97
  store ptr %98, ptr %"control value 13.47", align 1
  %99 = load ptr, ptr %"control value 13.43", align 1
  %100 = load ptr, ptr %"control value 13.47", align 1
  store ptr %100, ptr %99, align 1
  %101 = load ptr, ptr %previous_end, align 1
  store ptr %101, ptr %"control value 13.48", align 1
  %102 = load ptr, ptr %block, align 1
  store ptr %102, ptr %"control value 13.49", align 1
  %103 = load ptr, ptr %"control value 13.49", align 1
  store ptr %103, ptr %"control value 13.50", align 1
  %104 = load ptr, ptr %"control value 13.48", align 1
  %105 = load ptr, ptr %"control value 13.50", align 1
  %106 = icmp eq ptr %104, %105
  %107 = zext i1 %106 to i8
  store i8 %107, ptr %"control value 13.51", align 1
  %108 = load i8, ptr %"control value 13.51", align 1
  store i8 %108, ptr %adjacent, align 1
  %109 = load ptr, ptr %previous, align 1
  store ptr %109, ptr %"control value 13.52", align 1
  %110 = load ptr, ptr %"control value 13.52", align 1
  call void @tower.fn.guest_heap_merge(ptr %110)
  %111 = load i8, ptr %adjacent, align 1
  store i8 %111, ptr %"control value 13.53", align 1
  %112 = load i8, ptr %"control value 13.53", align 1
  %113 = icmp ne i8 %112, 0
  br i1 %113, label %if.body11, label %if.else12

if.else9:                                         ; preds = %loop.end
  br label %if.end10

if.end10:                                         ; preds = %if.end13, %if.else9
  %114 = load ptr, ptr %block, align 1
  store ptr %114, ptr %"control value 13.58", align 1
  %115 = load ptr, ptr %"control value 13.58", align 1
  %116 = getelementptr i8, ptr %115, i32 16
  store ptr %116, ptr %"control value 13.59", align 1
  %117 = load ptr, ptr %"control value 13.59", align 1
  store ptr %117, ptr %data1, align 1
  %118 = load ptr, ptr %data1, align 1
  store ptr %118, ptr %"control value 13.60", align 1
  %119 = load ptr, ptr %"control value 13.60", align 1
  %120 = ptrtoint ptr %119 to i32
  store i32 %120, ptr %"control value 13.61", align 1
  %121 = load ptr, ptr %block, align 1
  store ptr %121, ptr %"control value 13.62", align 1
  %122 = load ptr, ptr %"control value 13.62", align 1
  %123 = getelementptr i8, ptr %122, i32 0
  %124 = load i32, ptr %123, align 1
  store i32 %124, ptr %"control value 13.63", align 1
  %125 = load i32, ptr %"control value 13.61", align 1
  %126 = load i32, ptr %"control value 13.63", align 1
  %127 = add i32 %125, %126
  store i32 %127, ptr %"control value 13.64", align 1
  %128 = load i32, ptr %"control value 13.64", align 1
  store i32 %128, ptr %end, align 1
  %129 = load i32, ptr %end, align 1
  store i32 %129, ptr %"control value 13.65", align 1
  %130 = load ptr, ptr %heap, align 1
  store ptr %130, ptr %"control value 13.66", align 1
  %131 = load ptr, ptr %"control value 13.66", align 1
  %132 = getelementptr i8, ptr %131, i32 4
  %133 = load i32, ptr %132, align 1
  store i32 %133, ptr %"control value 13.67", align 1
  %134 = load i32, ptr %"control value 13.65", align 1
  %135 = load i32, ptr %"control value 13.67", align 1
  %136 = icmp eq i32 %134, %135
  %137 = zext i1 %136 to i8
  store i8 %137, ptr %"control value 13.68", align 1
  %138 = load i8, ptr %"control value 13.68", align 1
  %139 = icmp ne i8 %138, 0
  br i1 %139, label %if.body14, label %if.else15

if.body11:                                        ; preds = %if.body8
  store ptr %block, ptr %"control value 13.54", align 1
  %140 = load ptr, ptr %previous, align 1
  store ptr %140, ptr %"control value 13.55", align 1
  %141 = load ptr, ptr %"control value 13.54", align 1
  %142 = load ptr, ptr %"control value 13.55", align 1
  store ptr %142, ptr %141, align 1
  store ptr %link, ptr %"control value 13.56", align 1
  %143 = load ptr, ptr %previous_link, align 1
  store ptr %143, ptr %"control value 13.57", align 1
  %144 = load ptr, ptr %"control value 13.56", align 1
  %145 = load ptr, ptr %"control value 13.57", align 1
  store ptr %145, ptr %144, align 1
  br label %if.end13

if.else12:                                        ; preds = %if.body8
  br label %if.end13

if.end13:                                         ; preds = %if.else12, %if.body11
  br label %if.end10

if.body14:                                        ; preds = %if.end10
  %146 = load ptr, ptr %heap, align 1
  store ptr %146, ptr %"control value 13.69", align 1
  %147 = load ptr, ptr %"control value 13.69", align 1
  %148 = getelementptr i8, ptr %147, i32 4
  store ptr %148, ptr %"control value 13.70", align 1
  %149 = load ptr, ptr %block, align 1
  store ptr %149, ptr %"control value 13.71", align 1
  %150 = load ptr, ptr %"control value 13.71", align 1
  %151 = ptrtoint ptr %150 to i32
  store i32 %151, ptr %"control value 13.72", align 1
  %152 = load ptr, ptr %"control value 13.70", align 1
  %153 = load i32, ptr %"control value 13.72", align 1
  store i32 %153, ptr %152, align 1
  %154 = load ptr, ptr %link, align 1
  store ptr %154, ptr %"control value 13.73", align 1
  %155 = load ptr, ptr %block, align 1
  store ptr %155, ptr %"control value 13.74", align 1
  %156 = load ptr, ptr %"control value 13.74", align 1
  %157 = getelementptr i8, ptr %156, i32 4
  %158 = load ptr, ptr %157, align 1
  store ptr %158, ptr %"control value 13.75", align 1
  %159 = load ptr, ptr %"control value 13.73", align 1
  %160 = load ptr, ptr %"control value 13.75", align 1
  store ptr %160, ptr %159, align 1
  br label %if.end16

if.else15:                                        ; preds = %if.end10
  br label %if.end16

if.end16:                                         ; preds = %if.else15, %if.body14
  ret void
}

define ptr @guest_heap_reallocate(ptr %0, ptr %1, i32 %2, i32 %3) {
entry:
  %heap = alloca ptr, align 4
  %pointer = alloca ptr, align 4
  %count = alloca i32, align 4
  %size = alloca i32, align 4
  %maximum = alloca i32, align 4
  %limit = alloca i32, align 4
  %bytes = alloca i32, align 4
  %block = alloca ptr, align 4
  %result = alloca ptr, align 4
  %"control value 14.0" = alloca ptr, align 4
  %"control value 14.1" = alloca i32, align 4
  %"control value 14.2" = alloca i32, align 4
  %"control value 14.3" = alloca i32, align 4
  %"control value 14.4" = alloca i8, align 1
  %"control value 14.5" = alloca i32, align 4
  %"control value 14.6" = alloca i32, align 4
  %"control value 14.7" = alloca i32, align 4
  %"control value 14.8" = alloca i32, align 4
  %"control value 14.9" = alloca i32, align 4
  %"control value 14.10" = alloca i8, align 1
  %"control value 14.11" = alloca ptr, align 4
  %"control value 14.12" = alloca i8, align 1
  %"control value 14.13" = alloca ptr, align 4
  %"control value 14.14" = alloca i32, align 4
  %"control value 14.15" = alloca i32, align 4
  %"control value 14.16" = alloca ptr, align 4
  %"control value 14.17" = alloca i32, align 4
  %"control value 14.18" = alloca i32, align 4
  %"control value 14.19" = alloca i32, align 4
  %"control value 14.20" = alloca i32, align 4
  %"control value 14.21" = alloca i8, align 1
  %"control value 14.22" = alloca ptr, align 4
  %"control value 14.23" = alloca ptr, align 4
  %"control value 14.24" = alloca ptr, align 4
  %"control value 14.25" = alloca ptr, align 4
  %"control value 14.26" = alloca ptr, align 4
  %"control value 14.27" = alloca ptr, align 4
  %"control value 14.28" = alloca ptr, align 4
  %"control value 14.29" = alloca ptr, align 4
  %"control value 14.30" = alloca i32, align 4
  %"control value 14.31" = alloca i32, align 4
  %"control value 14.32" = alloca i8, align 1
  %"control value 14.33" = alloca ptr, align 4
  %"control value 14.34" = alloca ptr, align 4
  %"control value 14.35" = alloca i32, align 4
  %"control value 14.36" = alloca i32, align 4
  %"control value 14.37" = alloca ptr, align 4
  %"control value 14.38" = alloca ptr, align 4
  %"control value 14.39" = alloca i8, align 1
  %"control value 14.40" = alloca ptr, align 4
  %"control value 14.41" = alloca ptr, align 4
  %"control value 14.42" = alloca ptr, align 4
  %"control value 14.43" = alloca i32, align 4
  %"control value 14.44" = alloca ptr, align 4
  %"control value 14.45" = alloca ptr, align 4
  %"control value 14.46" = alloca ptr, align 4
  store ptr %0, ptr %heap, align 1
  store ptr %1, ptr %pointer, align 1
  store i32 %2, ptr %count, align 1
  store i32 %3, ptr %size, align 1
  store i32 0, ptr %maximum, align 1
  store ptr %maximum, ptr %"control value 14.0", align 1
  %4 = load ptr, ptr %"control value 14.0", align 1
  %5 = load i32, ptr %4, align 1
  store i32 %5, ptr %"control value 14.1", align 1
  %6 = load i32, ptr %"control value 14.1", align 1
  %7 = sub i32 %6, 1
  store i32 %7, ptr %"control value 14.2", align 1
  %8 = load ptr, ptr %"control value 14.0", align 1
  %9 = load i32, ptr %"control value 14.2", align 1
  store i32 %9, ptr %8, align 1
  %10 = load i32, ptr %size, align 1
  store i32 %10, ptr %"control value 14.3", align 1
  %11 = load i32, ptr %"control value 14.3", align 1
  %12 = icmp ne i32 %11, 0
  %13 = zext i1 %12 to i8
  store i8 %13, ptr %"control value 14.4", align 1
  %14 = load i8, ptr %"control value 14.4", align 1
  %15 = icmp ne i8 %14, 0
  br i1 %15, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %16 = load i32, ptr %maximum, align 1
  store i32 %16, ptr %"control value 14.5", align 1
  %17 = load i32, ptr %size, align 1
  store i32 %17, ptr %"control value 14.6", align 1
  %18 = load i32, ptr %"control value 14.5", align 1
  %19 = load i32, ptr %"control value 14.6", align 1
  %20 = icmp ne i32 %19, 0
  br i1 %20, label %valid, label %error

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.end3, %if.else
  %21 = load ptr, ptr %pointer, align 1
  store ptr %21, ptr %"control value 14.11", align 1
  %22 = load ptr, ptr %"control value 14.11", align 1
  %23 = icmp eq ptr %22, null
  %24 = zext i1 %23 to i8
  store i8 %24, ptr %"control value 14.12", align 1
  %25 = load i8, ptr %"control value 14.12", align 1
  %26 = icmp ne i8 %25, 0
  br i1 %26, label %if.body4, label %if.else5

valid:                                            ; preds = %if.body
  %27 = udiv i32 %18, %19
  store i32 %27, ptr %"control value 14.7", align 1
  %28 = load i32, ptr %"control value 14.7", align 1
  store i32 %28, ptr %limit, align 1
  %29 = load i32, ptr %count, align 1
  store i32 %29, ptr %"control value 14.8", align 1
  %30 = load i32, ptr %limit, align 1
  store i32 %30, ptr %"control value 14.9", align 1
  %31 = load i32, ptr %"control value 14.8", align 1
  %32 = load i32, ptr %"control value 14.9", align 1
  %33 = icmp ugt i32 %31, %32
  %34 = zext i1 %33 to i8
  store i8 %34, ptr %"control value 14.10", align 1
  %35 = load i8, ptr %"control value 14.10", align 1
  %36 = icmp ne i8 %35, 0
  br i1 %36, label %if.body1, label %if.else2

error:                                            ; preds = %if.body
  call void @tower_trap(ptr @5, i32 17520)
  unreachable

if.body1:                                         ; preds = %valid
  ret ptr null

if.else2:                                         ; preds = %valid
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  br label %if.end

if.body4:                                         ; preds = %if.end
  %37 = load ptr, ptr %heap, align 1
  store ptr %37, ptr %"control value 14.13", align 1
  %38 = load i32, ptr %count, align 1
  store i32 %38, ptr %"control value 14.14", align 1
  %39 = load i32, ptr %size, align 1
  store i32 %39, ptr %"control value 14.15", align 1
  %40 = load ptr, ptr %"control value 14.13", align 1
  %41 = load i32, ptr %"control value 14.14", align 1
  %42 = load i32, ptr %"control value 14.15", align 1
  %43 = call ptr @guest_heap_allocate(ptr %40, i32 %41, i32 %42) #12
  store ptr %43, ptr %"control value 14.16", align 1
  %44 = load ptr, ptr %"control value 14.16", align 1
  ret ptr %44

if.else5:                                         ; preds = %if.end
  br label %if.end6

if.end6:                                          ; preds = %if.else5
  %45 = load i32, ptr %count, align 1
  store i32 %45, ptr %"control value 14.17", align 1
  %46 = load i32, ptr %size, align 1
  store i32 %46, ptr %"control value 14.18", align 1
  %47 = load i32, ptr %"control value 14.17", align 1
  %48 = load i32, ptr %"control value 14.18", align 1
  %49 = mul i32 %47, %48
  store i32 %49, ptr %"control value 14.19", align 1
  %50 = load i32, ptr %"control value 14.19", align 1
  store i32 %50, ptr %bytes, align 1
  %51 = load i32, ptr %bytes, align 1
  store i32 %51, ptr %"control value 14.20", align 1
  %52 = load i32, ptr %"control value 14.20", align 1
  %53 = icmp eq i32 %52, 0
  %54 = zext i1 %53 to i8
  store i8 %54, ptr %"control value 14.21", align 1
  %55 = load i8, ptr %"control value 14.21", align 1
  %56 = icmp ne i8 %55, 0
  br i1 %56, label %if.body7, label %if.else8

if.body7:                                         ; preds = %if.end6
  %57 = load ptr, ptr %heap, align 1
  store ptr %57, ptr %"control value 14.22", align 1
  %58 = load ptr, ptr %pointer, align 1
  store ptr %58, ptr %"control value 14.23", align 1
  %59 = load ptr, ptr %"control value 14.22", align 1
  %60 = load ptr, ptr %"control value 14.23", align 1
  call void @guest_heap_free(ptr %59, ptr %60) #13
  ret ptr null

if.else8:                                         ; preds = %if.end6
  br label %if.end9

if.end9:                                          ; preds = %if.else8
  %61 = load ptr, ptr %pointer, align 1
  store ptr %61, ptr %"control value 14.24", align 1
  %62 = load ptr, ptr %"control value 14.24", align 1
  store ptr %62, ptr %"control value 14.25", align 1
  %63 = load ptr, ptr %"control value 14.25", align 1
  store ptr %63, ptr %block, align 1
  store ptr %block, ptr %"control value 14.26", align 1
  %64 = load ptr, ptr %"control value 14.26", align 1
  %65 = load ptr, ptr %64, align 1
  store ptr %65, ptr %"control value 14.27", align 1
  %66 = load ptr, ptr %"control value 14.27", align 1
  %67 = getelementptr i8, ptr %66, i32 -16
  store ptr %67, ptr %"control value 14.28", align 1
  %68 = load ptr, ptr %"control value 14.26", align 1
  %69 = load ptr, ptr %"control value 14.28", align 1
  store ptr %69, ptr %68, align 1
  %70 = load ptr, ptr %block, align 1
  store ptr %70, ptr %"control value 14.29", align 1
  %71 = load ptr, ptr %"control value 14.29", align 1
  %72 = getelementptr i8, ptr %71, i32 0
  %73 = load i32, ptr %72, align 1
  store i32 %73, ptr %"control value 14.30", align 1
  %74 = load i32, ptr %bytes, align 1
  store i32 %74, ptr %"control value 14.31", align 1
  %75 = load i32, ptr %"control value 14.30", align 1
  %76 = load i32, ptr %"control value 14.31", align 1
  %77 = icmp uge i32 %75, %76
  %78 = zext i1 %77 to i8
  store i8 %78, ptr %"control value 14.32", align 1
  %79 = load i8, ptr %"control value 14.32", align 1
  %80 = icmp ne i8 %79, 0
  br i1 %80, label %if.body10, label %if.else11

if.body10:                                        ; preds = %if.end9
  %81 = load ptr, ptr %pointer, align 1
  store ptr %81, ptr %"control value 14.33", align 1
  %82 = load ptr, ptr %"control value 14.33", align 1
  ret ptr %82

if.else11:                                        ; preds = %if.end9
  br label %if.end12

if.end12:                                         ; preds = %if.else11
  %83 = load ptr, ptr %heap, align 1
  store ptr %83, ptr %"control value 14.34", align 1
  %84 = load i32, ptr %count, align 1
  store i32 %84, ptr %"control value 14.35", align 1
  %85 = load i32, ptr %size, align 1
  store i32 %85, ptr %"control value 14.36", align 1
  %86 = load ptr, ptr %"control value 14.34", align 1
  %87 = load i32, ptr %"control value 14.35", align 1
  %88 = load i32, ptr %"control value 14.36", align 1
  %89 = call ptr @guest_heap_allocate(ptr %86, i32 %87, i32 %88) #12
  store ptr %89, ptr %"control value 14.37", align 1
  %90 = load ptr, ptr %"control value 14.37", align 1
  store ptr %90, ptr %result, align 1
  %91 = load ptr, ptr %result, align 1
  store ptr %91, ptr %"control value 14.38", align 1
  %92 = load ptr, ptr %"control value 14.38", align 1
  %93 = icmp ne ptr %92, null
  %94 = zext i1 %93 to i8
  store i8 %94, ptr %"control value 14.39", align 1
  %95 = load i8, ptr %"control value 14.39", align 1
  %96 = icmp ne i8 %95, 0
  br i1 %96, label %if.body13, label %if.else14

if.body13:                                        ; preds = %if.end12
  %97 = load ptr, ptr %result, align 1
  store ptr %97, ptr %"control value 14.40", align 1
  %98 = load ptr, ptr %pointer, align 1
  store ptr %98, ptr %"control value 14.41", align 1
  %99 = load ptr, ptr %block, align 1
  store ptr %99, ptr %"control value 14.42", align 1
  %100 = load ptr, ptr %"control value 14.42", align 1
  %101 = getelementptr i8, ptr %100, i32 0
  %102 = load i32, ptr %101, align 1
  store i32 %102, ptr %"control value 14.43", align 1
  %103 = load ptr, ptr %"control value 14.40", align 1
  %104 = load ptr, ptr %"control value 14.41", align 1
  %105 = load i32, ptr %"control value 14.43", align 1
  call void @llvm.memmove.p0.p0.i32(ptr align 1 %103, ptr align 1 %104, i32 %105, i1 false)
  %106 = load ptr, ptr %heap, align 1
  store ptr %106, ptr %"control value 14.44", align 1
  %107 = load ptr, ptr %pointer, align 1
  store ptr %107, ptr %"control value 14.45", align 1
  %108 = load ptr, ptr %"control value 14.44", align 1
  %109 = load ptr, ptr %"control value 14.45", align 1
  call void @guest_heap_free(ptr %108, ptr %109) #13
  br label %if.end15

if.else14:                                        ; preds = %if.end12
  br label %if.end15

if.end15:                                         ; preds = %if.else14, %if.body13
  %110 = load ptr, ptr %result, align 1
  store ptr %110, ptr %"control value 14.46", align 1
  %111 = load ptr, ptr %"control value 14.46", align 1
  ret ptr %111
}

; Function Attrs: nocallback nofree nosync nounwind willreturn memory(read)
declare i32 @llvm.wasm.memory.size.i32(i32) #2

; Function Attrs: nocallback nofree nosync nounwind willreturn
declare i32 @llvm.wasm.memory.grow.i32(i32, i32) #3

define internal i32 @tower.fn.guest_wasm_pages() {
entry:
  %"control value 17.0" = alloca i32, align 4
  %0 = call i32 @llvm.wasm.memory.size.i32(i32 0) #14
  store i32 %0, ptr %"control value 17.0", align 1
  %1 = load i32, ptr %"control value 17.0", align 1
  ret i32 %1
}

define internal i32 @tower.fn.guest_wasm_limit(i32 %0) {
entry:
  %pages = alloca i32, align 4
  %limit = alloca i64, align 8
  %"control value 18.0" = alloca i32, align 4
  %"control value 18.1" = alloca i64, align 8
  %"control value 18.2" = alloca i64, align 8
  %"control value 18.3" = alloca i64, align 8
  %"control value 18.4" = alloca i8, align 1
  %"control value 18.5" = alloca ptr, align 4
  %"control value 18.6" = alloca i64, align 8
  %"control value 18.7" = alloca i32, align 4
  store i32 %0, ptr %pages, align 1
  %1 = load i32, ptr %pages, align 1
  store i32 %1, ptr %"control value 18.0", align 1
  %2 = load i32, ptr %"control value 18.0", align 1
  %3 = zext i32 %2 to i64
  %4 = icmp ule i64 %3, -1
  %5 = and i1 true, %4
  br i1 %5, label %valid, label %error

valid:                                            ; preds = %entry
  %6 = zext i32 %2 to i64
  store i64 %6, ptr %"control value 18.1", align 1
  %7 = load i64, ptr %"control value 18.1", align 1
  %8 = mul i64 %7, 65536
  store i64 %8, ptr %"control value 18.2", align 1
  %9 = load i64, ptr %"control value 18.2", align 1
  store i64 %9, ptr %limit, align 1
  %10 = load i64, ptr %limit, align 1
  store i64 %10, ptr %"control value 18.3", align 1
  %11 = load i64, ptr %"control value 18.3", align 1
  %12 = icmp ugt i64 %11, 4294967295
  %13 = zext i1 %12 to i8
  store i8 %13, ptr %"control value 18.4", align 1
  %14 = load i8, ptr %"control value 18.4", align 1
  %15 = icmp ne i8 %14, 0
  br i1 %15, label %if.body, label %if.else

error:                                            ; preds = %entry
  call void @tower_trap(ptr @6, i32 23554)
  unreachable

if.body:                                          ; preds = %valid
  store ptr %limit, ptr %"control value 18.5", align 1
  %16 = load ptr, ptr %"control value 18.5", align 1
  store i64 4294967295, ptr %16, align 1
  br label %if.end

if.else:                                          ; preds = %valid
  br label %if.end

if.end:                                           ; preds = %if.else, %if.body
  %17 = load i64, ptr %limit, align 1
  store i64 %17, ptr %"control value 18.6", align 1
  %18 = load i64, ptr %"control value 18.6", align 1
  %19 = icmp ule i64 %18, 4294967295
  %20 = and i1 true, %19
  br i1 %20, label %valid1, label %error2

valid1:                                           ; preds = %if.end
  %21 = trunc i64 %18 to i32
  store i32 %21, ptr %"control value 18.7", align 1
  %22 = load i32, ptr %"control value 18.7", align 1
  ret i32 %22

error2:                                           ; preds = %if.end
  call void @tower_trap(ptr @7, i32 23554)
  unreachable
}

define zeroext i8 @guest_wasm_init(ptr %0) {
entry:
  %heap = alloca ptr, align 4
  %pages = alloca i32, align 4
  %end = alloca ptr, align 4
  %"control value 19.0" = alloca i32, align 4
  %"control value 19.1" = alloca i32, align 4
  %"control value 19.2" = alloca i8, align 1
  %"control value 19.3" = alloca i32, align 4
  %"control value 19.4" = alloca i32, align 4
  %"control value 19.5" = alloca ptr, align 4
  %"control value 19.6" = alloca ptr, align 4
  %"control value 19.7" = alloca ptr, align 4
  %"control value 19.8" = alloca ptr, align 4
  %"control value 19.9" = alloca i8, align 1
  store ptr %0, ptr %heap, align 1
  %1 = call i32 @tower.fn.guest_wasm_pages()
  store i32 %1, ptr %"control value 19.0", align 1
  %2 = load i32, ptr %"control value 19.0", align 1
  store i32 %2, ptr %pages, align 1
  %3 = load i32, ptr %pages, align 1
  store i32 %3, ptr %"control value 19.1", align 1
  %4 = load i32, ptr %"control value 19.1", align 1
  %5 = icmp uge i32 %4, 65536
  %6 = zext i1 %5 to i8
  store i8 %6, ptr %"control value 19.2", align 1
  %7 = load i8, ptr %"control value 19.2", align 1
  %8 = icmp ne i8 %7, 0
  br i1 %8, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret i8 0

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %9 = load i32, ptr %pages, align 1
  store i32 %9, ptr %"control value 19.3", align 1
  %10 = load i32, ptr %"control value 19.3", align 1
  %11 = call i32 @tower.fn.guest_wasm_limit(i32 %10)
  store i32 %11, ptr %"control value 19.4", align 1
  %12 = load i32, ptr %"control value 19.4", align 1
  %13 = inttoptr i32 %12 to ptr
  store ptr %13, ptr %"control value 19.5", align 1
  %14 = load ptr, ptr %"control value 19.5", align 1
  store ptr %14, ptr %end, align 1
  %15 = load ptr, ptr %heap, align 1
  store ptr %15, ptr %"control value 19.6", align 1
  %16 = load ptr, ptr %end, align 1
  store ptr %16, ptr %"control value 19.7", align 1
  %17 = load ptr, ptr %end, align 1
  store ptr %17, ptr %"control value 19.8", align 1
  %18 = load ptr, ptr %"control value 19.6", align 1
  %19 = load ptr, ptr %"control value 19.7", align 1
  %20 = load ptr, ptr %"control value 19.8", align 1
  %21 = call zeroext i8 @guest_heap_init(ptr %18, ptr %19, ptr %20) #15
  store i8 %21, ptr %"control value 19.9", align 1
  %22 = load i8, ptr %"control value 19.9", align 1
  ret i8 %22
}

define ptr @guest_wasm_allocate(ptr %0, i32 %1, i32 %2) {
entry:
  %heap = alloca ptr, align 4
  %count = alloca i32, align 4
  %size = alloca i32, align 4
  %result = alloca ptr, align 4
  %bytes = alloca i32, align 4
  %overflow = alloca i8, align 1
  %end = alloca i64, align 8
  %pages = alloca i32, align 4
  %needed = alloca i64, align 8
  %committed = alloca i32, align 4
  %delta = alloca i32, align 4
  %previous = alloca i32, align 4
  %limit = alloca ptr, align 4
  %"control value 20.0" = alloca ptr, align 4
  %"control value 20.1" = alloca i32, align 4
  %"control value 20.2" = alloca i32, align 4
  %"control value 20.3" = alloca ptr, align 4
  %"control value 20.4" = alloca ptr, align 4
  %"control value 20.5" = alloca i8, align 1
  %"control value 20.6" = alloca ptr, align 4
  %"control value 20.7" = alloca i32, align 4
  %"control value 20.8" = alloca i32, align 4
  %"control value 20.9" = alloca i32, align 4
  %"control value 20.10" = alloca i32, align 4
  %"control value 20.11" = alloca i8, align 1
  %"control value 20.12" = alloca i8, align 1
  %"control value 20.13" = alloca ptr, align 4
  %"control value 20.14" = alloca i32, align 4
  %"control value 20.15" = alloca i64, align 8
  %"control value 20.16" = alloca i32, align 4
  %"control value 20.17" = alloca i64, align 8
  %"control value 20.18" = alloca i64, align 8
  %"control value 20.19" = alloca ptr, align 4
  %"control value 20.20" = alloca i64, align 8
  %"control value 20.21" = alloca i32, align 4
  %"control value 20.22" = alloca i64, align 8
  %"control value 20.23" = alloca i64, align 8
  %"control value 20.24" = alloca ptr, align 4
  %"control value 20.25" = alloca i64, align 8
  %"control value 20.26" = alloca i8, align 1
  %"control value 20.27" = alloca i8, align 1
  %"control value 20.28" = alloca i32, align 4
  %"control value 20.29" = alloca ptr, align 4
  %"control value 20.30" = alloca i32, align 4
  %"control value 20.31" = alloca i32, align 4
  %"control value 20.32" = alloca i32, align 4
  %"control value 20.33" = alloca i8, align 1
  %"control value 20.34" = alloca i64, align 8
  %"control value 20.35" = alloca i64, align 8
  %"control value 20.36" = alloca ptr, align 4
  %"control value 20.37" = alloca i64, align 8
  %"control value 20.38" = alloca i64, align 8
  %"control value 20.39" = alloca i64, align 8
  %"control value 20.40" = alloca i32, align 4
  %"control value 20.41" = alloca i32, align 4
  %"control value 20.42" = alloca i32, align 4
  %"control value 20.43" = alloca i32, align 4
  %"control value 20.44" = alloca i32, align 4
  %"control value 20.45" = alloca i32, align 4
  %"control value 20.46" = alloca i32, align 4
  %"control value 20.47" = alloca i32, align 4
  %"control value 20.48" = alloca i8, align 1
  %"control value 20.49" = alloca i32, align 4
  %"control value 20.50" = alloca i32, align 4
  %"control value 20.51" = alloca ptr, align 4
  %"control value 20.52" = alloca ptr, align 4
  %"control value 20.53" = alloca ptr, align 4
  %"control value 20.54" = alloca i8, align 1
  %"control value 20.55" = alloca ptr, align 4
  %"control value 20.56" = alloca i32, align 4
  %"control value 20.57" = alloca i32, align 4
  %"control value 20.58" = alloca ptr, align 4
  store ptr %0, ptr %heap, align 1
  store i32 %1, ptr %count, align 1
  store i32 %2, ptr %size, align 1
  %3 = load ptr, ptr %heap, align 1
  store ptr %3, ptr %"control value 20.0", align 1
  %4 = load i32, ptr %count, align 1
  store i32 %4, ptr %"control value 20.1", align 1
  %5 = load i32, ptr %size, align 1
  store i32 %5, ptr %"control value 20.2", align 1
  %6 = load ptr, ptr %"control value 20.0", align 1
  %7 = load i32, ptr %"control value 20.1", align 1
  %8 = load i32, ptr %"control value 20.2", align 1
  %9 = call ptr @guest_heap_allocate(ptr %6, i32 %7, i32 %8) #12
  store ptr %9, ptr %"control value 20.3", align 1
  %10 = load ptr, ptr %"control value 20.3", align 1
  store ptr %10, ptr %result, align 1
  %11 = load ptr, ptr %result, align 1
  store ptr %11, ptr %"control value 20.4", align 1
  %12 = load ptr, ptr %"control value 20.4", align 1
  %13 = icmp ne ptr %12, null
  %14 = zext i1 %13 to i8
  store i8 %14, ptr %"control value 20.5", align 1
  %15 = load i8, ptr %"control value 20.5", align 1
  %16 = icmp ne i8 %15, 0
  br i1 %16, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  %17 = load ptr, ptr %result, align 1
  store ptr %17, ptr %"control value 20.6", align 1
  %18 = load ptr, ptr %"control value 20.6", align 1
  ret ptr %18

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %19 = load i32, ptr %count, align 1
  store i32 %19, ptr %"control value 20.7", align 1
  %20 = load i32, ptr %size, align 1
  store i32 %20, ptr %"control value 20.8", align 1
  %21 = load i32, ptr %"control value 20.7", align 1
  %22 = load i32, ptr %"control value 20.8", align 1
  %23 = call i32 @tower.fn.guest_heap_request_size(i32 %21, i32 %22)
  store i32 %23, ptr %"control value 20.9", align 1
  %24 = load i32, ptr %"control value 20.9", align 1
  store i32 %24, ptr %bytes, align 1
  %25 = load i32, ptr %bytes, align 1
  store i32 %25, ptr %"control value 20.10", align 1
  %26 = load i32, ptr %"control value 20.10", align 1
  %27 = icmp eq i32 %26, 0
  %28 = zext i1 %27 to i8
  store i8 %28, ptr %"control value 20.11", align 1
  %29 = load i8, ptr %"control value 20.11", align 1
  store i8 %29, ptr %overflow, align 1
  %30 = load i8, ptr %overflow, align 1
  store i8 %30, ptr %"control value 20.12", align 1
  %31 = load i8, ptr %"control value 20.12", align 1
  %32 = icmp ne i8 %31, 0
  br i1 %32, label %if.body1, label %if.else2

if.body1:                                         ; preds = %if.end
  ret ptr null

if.else2:                                         ; preds = %if.end
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  %33 = load ptr, ptr %heap, align 1
  store ptr %33, ptr %"control value 20.13", align 1
  %34 = load ptr, ptr %"control value 20.13", align 1
  %35 = getelementptr i8, ptr %34, i32 4
  %36 = load i32, ptr %35, align 1
  store i32 %36, ptr %"control value 20.14", align 1
  %37 = load i32, ptr %"control value 20.14", align 1
  %38 = zext i32 %37 to i64
  %39 = icmp ule i64 %38, -1
  %40 = and i1 true, %39
  br i1 %40, label %valid, label %error

valid:                                            ; preds = %if.end3
  %41 = zext i32 %37 to i64
  store i64 %41, ptr %"control value 20.15", align 1
  store i32 16, ptr %"control value 20.16", align 1
  %42 = load i32, ptr %"control value 20.16", align 1
  %43 = zext i32 %42 to i64
  %44 = icmp ule i64 %43, -1
  %45 = and i1 true, %44
  br i1 %45, label %valid4, label %error5

error:                                            ; preds = %if.end3
  call void @tower_trap(ptr @8, i32 23554)
  unreachable

valid4:                                           ; preds = %valid
  %46 = zext i32 %42 to i64
  store i64 %46, ptr %"control value 20.17", align 1
  %47 = load i64, ptr %"control value 20.15", align 1
  %48 = load i64, ptr %"control value 20.17", align 1
  %49 = add i64 %47, %48
  store i64 %49, ptr %"control value 20.18", align 1
  %50 = load i64, ptr %"control value 20.18", align 1
  store i64 %50, ptr %end, align 1
  store ptr %end, ptr %"control value 20.19", align 1
  %51 = load i64, ptr %end, align 1
  store i64 %51, ptr %"control value 20.20", align 1
  %52 = load i32, ptr %bytes, align 1
  store i32 %52, ptr %"control value 20.21", align 1
  %53 = load i32, ptr %"control value 20.21", align 1
  %54 = zext i32 %53 to i64
  %55 = icmp ule i64 %54, -1
  %56 = and i1 true, %55
  br i1 %56, label %valid6, label %error7

error5:                                           ; preds = %valid
  call void @tower_trap(ptr @9, i32 23554)
  unreachable

valid6:                                           ; preds = %valid4
  %57 = zext i32 %53 to i64
  store i64 %57, ptr %"control value 20.22", align 1
  %58 = load i64, ptr %"control value 20.20", align 1
  %59 = load i64, ptr %"control value 20.22", align 1
  %60 = add i64 %58, %59
  store i64 %60, ptr %"control value 20.23", align 1
  %61 = load ptr, ptr %"control value 20.19", align 1
  %62 = load i64, ptr %"control value 20.23", align 1
  store i64 %62, ptr %61, align 1
  store ptr %overflow, ptr %"control value 20.24", align 1
  %63 = load i64, ptr %end, align 1
  store i64 %63, ptr %"control value 20.25", align 1
  %64 = load i64, ptr %"control value 20.25", align 1
  %65 = icmp ugt i64 %64, 4294967295
  %66 = zext i1 %65 to i8
  store i8 %66, ptr %"control value 20.26", align 1
  %67 = load ptr, ptr %"control value 20.24", align 1
  %68 = load i8, ptr %"control value 20.26", align 1
  store i8 %68, ptr %67, align 1
  %69 = load i8, ptr %overflow, align 1
  store i8 %69, ptr %"control value 20.27", align 1
  %70 = load i8, ptr %"control value 20.27", align 1
  %71 = icmp ne i8 %70, 0
  br i1 %71, label %if.body8, label %if.else9

error7:                                           ; preds = %valid4
  call void @tower_trap(ptr @10, i32 23554)
  unreachable

if.body8:                                         ; preds = %valid6
  ret ptr null

if.else9:                                         ; preds = %valid6
  br label %if.end10

if.end10:                                         ; preds = %if.else9
  %72 = call i32 @tower.fn.guest_wasm_pages()
  store i32 %72, ptr %"control value 20.28", align 1
  %73 = load i32, ptr %"control value 20.28", align 1
  store i32 %73, ptr %pages, align 1
  %74 = load ptr, ptr %heap, align 1
  store ptr %74, ptr %"control value 20.29", align 1
  %75 = load ptr, ptr %"control value 20.29", align 1
  %76 = getelementptr i8, ptr %75, i32 8
  %77 = load i32, ptr %76, align 1
  store i32 %77, ptr %"control value 20.30", align 1
  %78 = load i32, ptr %pages, align 1
  store i32 %78, ptr %"control value 20.31", align 1
  %79 = load i32, ptr %"control value 20.31", align 1
  %80 = call i32 @tower.fn.guest_wasm_limit(i32 %79)
  store i32 %80, ptr %"control value 20.32", align 1
  %81 = load i32, ptr %"control value 20.30", align 1
  %82 = load i32, ptr %"control value 20.32", align 1
  %83 = icmp ne i32 %81, %82
  %84 = zext i1 %83 to i8
  store i8 %84, ptr %"control value 20.33", align 1
  %85 = load i8, ptr %"control value 20.33", align 1
  %86 = icmp ne i8 %85, 0
  br i1 %86, label %if.body11, label %if.else12

if.body11:                                        ; preds = %if.end10
  ret ptr null

if.else12:                                        ; preds = %if.end10
  br label %if.end13

if.end13:                                         ; preds = %if.else12
  %87 = load i64, ptr %end, align 1
  store i64 %87, ptr %"control value 20.34", align 1
  %88 = load i64, ptr %"control value 20.34", align 1
  %89 = add i64 %88, 65535
  store i64 %89, ptr %"control value 20.35", align 1
  %90 = load i64, ptr %"control value 20.35", align 1
  store i64 %90, ptr %needed, align 1
  store ptr %needed, ptr %"control value 20.36", align 1
  %91 = load i64, ptr %needed, align 1
  store i64 %91, ptr %"control value 20.37", align 1
  %92 = load i64, ptr %"control value 20.37", align 1
  br i1 true, label %valid14, label %error15

valid14:                                          ; preds = %if.end13
  %93 = udiv i64 %92, 65536
  store i64 %93, ptr %"control value 20.38", align 1
  %94 = load ptr, ptr %"control value 20.36", align 1
  %95 = load i64, ptr %"control value 20.38", align 1
  store i64 %95, ptr %94, align 1
  %96 = load i64, ptr %needed, align 1
  store i64 %96, ptr %"control value 20.39", align 1
  %97 = load i64, ptr %"control value 20.39", align 1
  %98 = icmp ule i64 %97, 4294967295
  %99 = and i1 true, %98
  br i1 %99, label %valid16, label %error17

error15:                                          ; preds = %if.end13
  call void @tower_trap(ptr @11, i32 23554)
  unreachable

valid16:                                          ; preds = %valid14
  %100 = trunc i64 %97 to i32
  store i32 %100, ptr %"control value 20.40", align 1
  %101 = load i32, ptr %"control value 20.40", align 1
  store i32 %101, ptr %committed, align 1
  %102 = load i32, ptr %committed, align 1
  store i32 %102, ptr %"control value 20.41", align 1
  %103 = load i32, ptr %pages, align 1
  store i32 %103, ptr %"control value 20.42", align 1
  %104 = load i32, ptr %"control value 20.41", align 1
  %105 = load i32, ptr %"control value 20.42", align 1
  %106 = sub i32 %104, %105
  store i32 %106, ptr %"control value 20.43", align 1
  %107 = load i32, ptr %"control value 20.43", align 1
  store i32 %107, ptr %delta, align 1
  %108 = load i32, ptr %delta, align 1
  store i32 %108, ptr %"control value 20.44", align 1
  %109 = load i32, ptr %"control value 20.44", align 1
  %110 = call i32 @llvm.wasm.memory.grow.i32(i32 0, i32 %109) #16
  store i32 %110, ptr %"control value 20.45", align 1
  %111 = load i32, ptr %"control value 20.45", align 1
  store i32 %111, ptr %previous, align 1
  %112 = load i32, ptr %previous, align 1
  store i32 %112, ptr %"control value 20.46", align 1
  %113 = load i32, ptr %pages, align 1
  store i32 %113, ptr %"control value 20.47", align 1
  %114 = load i32, ptr %"control value 20.46", align 1
  %115 = load i32, ptr %"control value 20.47", align 1
  %116 = icmp ne i32 %114, %115
  %117 = zext i1 %116 to i8
  store i8 %117, ptr %"control value 20.48", align 1
  %118 = load i8, ptr %"control value 20.48", align 1
  %119 = icmp ne i8 %118, 0
  br i1 %119, label %if.body18, label %if.else19

error17:                                          ; preds = %valid14
  call void @tower_trap(ptr @12, i32 23554)
  unreachable

if.body18:                                        ; preds = %valid16
  ret ptr null

if.else19:                                        ; preds = %valid16
  br label %if.end20

if.end20:                                         ; preds = %if.else19
  %120 = load i32, ptr %committed, align 1
  store i32 %120, ptr %"control value 20.49", align 1
  %121 = load i32, ptr %"control value 20.49", align 1
  %122 = call i32 @tower.fn.guest_wasm_limit(i32 %121)
  store i32 %122, ptr %"control value 20.50", align 1
  %123 = load i32, ptr %"control value 20.50", align 1
  %124 = inttoptr i32 %123 to ptr
  store ptr %124, ptr %"control value 20.51", align 1
  %125 = load ptr, ptr %"control value 20.51", align 1
  store ptr %125, ptr %limit, align 1
  %126 = load ptr, ptr %heap, align 1
  store ptr %126, ptr %"control value 20.52", align 1
  %127 = load ptr, ptr %limit, align 1
  store ptr %127, ptr %"control value 20.53", align 1
  %128 = load ptr, ptr %"control value 20.52", align 1
  %129 = load ptr, ptr %"control value 20.53", align 1
  %130 = call zeroext i8 @guest_heap_extend(ptr %128, ptr %129) #17
  store i8 %130, ptr %"control value 20.54", align 1
  %131 = load ptr, ptr %heap, align 1
  store ptr %131, ptr %"control value 20.55", align 1
  %132 = load i32, ptr %count, align 1
  store i32 %132, ptr %"control value 20.56", align 1
  %133 = load i32, ptr %size, align 1
  store i32 %133, ptr %"control value 20.57", align 1
  %134 = load ptr, ptr %"control value 20.55", align 1
  %135 = load i32, ptr %"control value 20.56", align 1
  %136 = load i32, ptr %"control value 20.57", align 1
  %137 = call ptr @guest_heap_allocate(ptr %134, i32 %135, i32 %136) #12
  store ptr %137, ptr %"control value 20.58", align 1
  %138 = load ptr, ptr %"control value 20.58", align 1
  ret ptr %138
}

define ptr @guest_wasm_reallocate(ptr %0, ptr %1, i32 %2, i32 %3) {
entry:
  %heap = alloca ptr, align 4
  %pointer = alloca ptr, align 4
  %count = alloca i32, align 4
  %size = alloca i32, align 4
  %requested = alloca i32, align 4
  %bytes = alloca i32, align 4
  %block = alloca ptr, align 4
  %result = alloca ptr, align 4
  %"control value 21.0" = alloca i32, align 4
  %"control value 21.1" = alloca i32, align 4
  %"control value 21.2" = alloca i32, align 4
  %"control value 21.3" = alloca i32, align 4
  %"control value 21.4" = alloca i8, align 1
  %"control value 21.5" = alloca ptr, align 4
  %"control value 21.6" = alloca i8, align 1
  %"control value 21.7" = alloca ptr, align 4
  %"control value 21.8" = alloca i32, align 4
  %"control value 21.9" = alloca i32, align 4
  %"control value 21.10" = alloca ptr, align 4
  %"control value 21.11" = alloca i32, align 4
  %"control value 21.12" = alloca i32, align 4
  %"control value 21.13" = alloca i32, align 4
  %"control value 21.14" = alloca i32, align 4
  %"control value 21.15" = alloca i8, align 1
  %"control value 21.16" = alloca ptr, align 4
  %"control value 21.17" = alloca ptr, align 4
  %"control value 21.18" = alloca ptr, align 4
  %"control value 21.19" = alloca ptr, align 4
  %"control value 21.20" = alloca ptr, align 4
  %"control value 21.21" = alloca ptr, align 4
  %"control value 21.22" = alloca ptr, align 4
  %"control value 21.23" = alloca ptr, align 4
  %"control value 21.24" = alloca i32, align 4
  %"control value 21.25" = alloca i32, align 4
  %"control value 21.26" = alloca i8, align 1
  %"control value 21.27" = alloca ptr, align 4
  %"control value 21.28" = alloca ptr, align 4
  %"control value 21.29" = alloca i32, align 4
  %"control value 21.30" = alloca i32, align 4
  %"control value 21.31" = alloca ptr, align 4
  %"control value 21.32" = alloca ptr, align 4
  %"control value 21.33" = alloca i8, align 1
  %"control value 21.34" = alloca ptr, align 4
  %"control value 21.35" = alloca ptr, align 4
  %"control value 21.36" = alloca ptr, align 4
  %"control value 21.37" = alloca i32, align 4
  %"control value 21.38" = alloca ptr, align 4
  %"control value 21.39" = alloca ptr, align 4
  %"control value 21.40" = alloca ptr, align 4
  store ptr %0, ptr %heap, align 1
  store ptr %1, ptr %pointer, align 1
  store i32 %2, ptr %count, align 1
  store i32 %3, ptr %size, align 1
  %4 = load i32, ptr %count, align 1
  store i32 %4, ptr %"control value 21.0", align 1
  %5 = load i32, ptr %size, align 1
  store i32 %5, ptr %"control value 21.1", align 1
  %6 = load i32, ptr %"control value 21.0", align 1
  %7 = load i32, ptr %"control value 21.1", align 1
  %8 = call i32 @tower.fn.guest_heap_request_size(i32 %6, i32 %7)
  store i32 %8, ptr %"control value 21.2", align 1
  %9 = load i32, ptr %"control value 21.2", align 1
  store i32 %9, ptr %requested, align 1
  %10 = load i32, ptr %requested, align 1
  store i32 %10, ptr %"control value 21.3", align 1
  %11 = load i32, ptr %"control value 21.3", align 1
  %12 = icmp eq i32 %11, 0
  %13 = zext i1 %12 to i8
  store i8 %13, ptr %"control value 21.4", align 1
  %14 = load i8, ptr %"control value 21.4", align 1
  %15 = icmp ne i8 %14, 0
  br i1 %15, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret ptr null

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %16 = load ptr, ptr %pointer, align 1
  store ptr %16, ptr %"control value 21.5", align 1
  %17 = load ptr, ptr %"control value 21.5", align 1
  %18 = icmp eq ptr %17, null
  %19 = zext i1 %18 to i8
  store i8 %19, ptr %"control value 21.6", align 1
  %20 = load i8, ptr %"control value 21.6", align 1
  %21 = icmp ne i8 %20, 0
  br i1 %21, label %if.body1, label %if.else2

if.body1:                                         ; preds = %if.end
  %22 = load ptr, ptr %heap, align 1
  store ptr %22, ptr %"control value 21.7", align 1
  %23 = load i32, ptr %count, align 1
  store i32 %23, ptr %"control value 21.8", align 1
  %24 = load i32, ptr %size, align 1
  store i32 %24, ptr %"control value 21.9", align 1
  %25 = load ptr, ptr %"control value 21.7", align 1
  %26 = load i32, ptr %"control value 21.8", align 1
  %27 = load i32, ptr %"control value 21.9", align 1
  %28 = call ptr @guest_wasm_allocate(ptr %25, i32 %26, i32 %27) #18
  store ptr %28, ptr %"control value 21.10", align 1
  %29 = load ptr, ptr %"control value 21.10", align 1
  ret ptr %29

if.else2:                                         ; preds = %if.end
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  %30 = load i32, ptr %count, align 1
  store i32 %30, ptr %"control value 21.11", align 1
  %31 = load i32, ptr %size, align 1
  store i32 %31, ptr %"control value 21.12", align 1
  %32 = load i32, ptr %"control value 21.11", align 1
  %33 = load i32, ptr %"control value 21.12", align 1
  %34 = mul i32 %32, %33
  store i32 %34, ptr %"control value 21.13", align 1
  %35 = load i32, ptr %"control value 21.13", align 1
  store i32 %35, ptr %bytes, align 1
  %36 = load i32, ptr %bytes, align 1
  store i32 %36, ptr %"control value 21.14", align 1
  %37 = load i32, ptr %"control value 21.14", align 1
  %38 = icmp eq i32 %37, 0
  %39 = zext i1 %38 to i8
  store i8 %39, ptr %"control value 21.15", align 1
  %40 = load i8, ptr %"control value 21.15", align 1
  %41 = icmp ne i8 %40, 0
  br i1 %41, label %if.body4, label %if.else5

if.body4:                                         ; preds = %if.end3
  %42 = load ptr, ptr %heap, align 1
  store ptr %42, ptr %"control value 21.16", align 1
  %43 = load ptr, ptr %pointer, align 1
  store ptr %43, ptr %"control value 21.17", align 1
  %44 = load ptr, ptr %"control value 21.16", align 1
  %45 = load ptr, ptr %"control value 21.17", align 1
  call void @guest_heap_free(ptr %44, ptr %45) #13
  ret ptr null

if.else5:                                         ; preds = %if.end3
  br label %if.end6

if.end6:                                          ; preds = %if.else5
  %46 = load ptr, ptr %pointer, align 1
  store ptr %46, ptr %"control value 21.18", align 1
  %47 = load ptr, ptr %"control value 21.18", align 1
  store ptr %47, ptr %"control value 21.19", align 1
  %48 = load ptr, ptr %"control value 21.19", align 1
  store ptr %48, ptr %block, align 1
  store ptr %block, ptr %"control value 21.20", align 1
  %49 = load ptr, ptr %"control value 21.20", align 1
  %50 = load ptr, ptr %49, align 1
  store ptr %50, ptr %"control value 21.21", align 1
  %51 = load ptr, ptr %"control value 21.21", align 1
  %52 = getelementptr i8, ptr %51, i32 -16
  store ptr %52, ptr %"control value 21.22", align 1
  %53 = load ptr, ptr %"control value 21.20", align 1
  %54 = load ptr, ptr %"control value 21.22", align 1
  store ptr %54, ptr %53, align 1
  %55 = load ptr, ptr %block, align 1
  store ptr %55, ptr %"control value 21.23", align 1
  %56 = load ptr, ptr %"control value 21.23", align 1
  %57 = getelementptr i8, ptr %56, i32 0
  %58 = load i32, ptr %57, align 1
  store i32 %58, ptr %"control value 21.24", align 1
  %59 = load i32, ptr %bytes, align 1
  store i32 %59, ptr %"control value 21.25", align 1
  %60 = load i32, ptr %"control value 21.24", align 1
  %61 = load i32, ptr %"control value 21.25", align 1
  %62 = icmp uge i32 %60, %61
  %63 = zext i1 %62 to i8
  store i8 %63, ptr %"control value 21.26", align 1
  %64 = load i8, ptr %"control value 21.26", align 1
  %65 = icmp ne i8 %64, 0
  br i1 %65, label %if.body7, label %if.else8

if.body7:                                         ; preds = %if.end6
  %66 = load ptr, ptr %pointer, align 1
  store ptr %66, ptr %"control value 21.27", align 1
  %67 = load ptr, ptr %"control value 21.27", align 1
  ret ptr %67

if.else8:                                         ; preds = %if.end6
  br label %if.end9

if.end9:                                          ; preds = %if.else8
  %68 = load ptr, ptr %heap, align 1
  store ptr %68, ptr %"control value 21.28", align 1
  %69 = load i32, ptr %count, align 1
  store i32 %69, ptr %"control value 21.29", align 1
  %70 = load i32, ptr %size, align 1
  store i32 %70, ptr %"control value 21.30", align 1
  %71 = load ptr, ptr %"control value 21.28", align 1
  %72 = load i32, ptr %"control value 21.29", align 1
  %73 = load i32, ptr %"control value 21.30", align 1
  %74 = call ptr @guest_wasm_allocate(ptr %71, i32 %72, i32 %73) #18
  store ptr %74, ptr %"control value 21.31", align 1
  %75 = load ptr, ptr %"control value 21.31", align 1
  store ptr %75, ptr %result, align 1
  %76 = load ptr, ptr %result, align 1
  store ptr %76, ptr %"control value 21.32", align 1
  %77 = load ptr, ptr %"control value 21.32", align 1
  %78 = icmp ne ptr %77, null
  %79 = zext i1 %78 to i8
  store i8 %79, ptr %"control value 21.33", align 1
  %80 = load i8, ptr %"control value 21.33", align 1
  %81 = icmp ne i8 %80, 0
  br i1 %81, label %if.body10, label %if.else11

if.body10:                                        ; preds = %if.end9
  %82 = load ptr, ptr %result, align 1
  store ptr %82, ptr %"control value 21.34", align 1
  %83 = load ptr, ptr %pointer, align 1
  store ptr %83, ptr %"control value 21.35", align 1
  %84 = load ptr, ptr %block, align 1
  store ptr %84, ptr %"control value 21.36", align 1
  %85 = load ptr, ptr %"control value 21.36", align 1
  %86 = getelementptr i8, ptr %85, i32 0
  %87 = load i32, ptr %86, align 1
  store i32 %87, ptr %"control value 21.37", align 1
  %88 = load ptr, ptr %"control value 21.34", align 1
  %89 = load ptr, ptr %"control value 21.35", align 1
  %90 = load i32, ptr %"control value 21.37", align 1
  call void @llvm.memmove.p0.p0.i32(ptr align 1 %88, ptr align 1 %89, i32 %90, i1 false)
  %91 = load ptr, ptr %heap, align 1
  store ptr %91, ptr %"control value 21.38", align 1
  %92 = load ptr, ptr %pointer, align 1
  store ptr %92, ptr %"control value 21.39", align 1
  %93 = load ptr, ptr %"control value 21.38", align 1
  %94 = load ptr, ptr %"control value 21.39", align 1
  call void @guest_heap_free(ptr %93, ptr %94) #13
  br label %if.end12

if.else11:                                        ; preds = %if.end9
  br label %if.end12

if.end12:                                         ; preds = %if.else11, %if.body10
  %95 = load ptr, ptr %result, align 1
  store ptr %95, ptr %"control value 21.40", align 1
  %96 = load ptr, ptr %"control value 21.40", align 1
  ret ptr %96
}

define ptr @guest_wasm_context() #4 {
entry:
  ret ptr @tower.runtime.wasm.heap
}

define ptr @guest_wasm_heap_base() #5 {
entry:
  ret ptr @__heap_base
}

define internal ptr @tower.fn.guest_wasm_runtime_heap() {
entry:
  %heap = alloca ptr, align 4
  %limit = alloca ptr, align 4
  %"control value 24.0" = alloca ptr, align 4
  %"control value 24.1" = alloca ptr, align 4
  %"control value 24.2" = alloca i32, align 4
  %"control value 24.3" = alloca i8, align 1
  %"control value 24.4" = alloca i32, align 4
  %"control value 24.5" = alloca i8, align 1
  %"control value 24.6" = alloca i8, align 1
  %"control value 24.7" = alloca i32, align 4
  %"control value 24.8" = alloca i32, align 4
  %"control value 24.9" = alloca ptr, align 4
  %"control value 24.10" = alloca ptr, align 4
  %"control value 24.11" = alloca ptr, align 4
  %"control value 24.12" = alloca ptr, align 4
  %"control value 24.13" = alloca i8, align 1
  %"control value 24.14" = alloca i8, align 1
  %"control value 24.15" = alloca ptr, align 4
  %0 = call ptr @guest_wasm_context() #4
  store ptr %0, ptr %"control value 24.0", align 1
  %1 = load ptr, ptr %"control value 24.0", align 1
  store ptr %1, ptr %heap, align 1
  %2 = load ptr, ptr %heap, align 1
  store ptr %2, ptr %"control value 24.1", align 1
  %3 = load ptr, ptr %"control value 24.1", align 1
  %4 = getelementptr i8, ptr %3, i32 4
  %5 = load i32, ptr %4, align 1
  store i32 %5, ptr %"control value 24.2", align 1
  %6 = load i32, ptr %"control value 24.2", align 1
  %7 = icmp eq i32 %6, 0
  %8 = zext i1 %7 to i8
  store i8 %8, ptr %"control value 24.3", align 1
  %9 = load i8, ptr %"control value 24.3", align 1
  %10 = icmp ne i8 %9, 0
  br i1 %10, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  store i32 12, ptr %"control value 24.4", align 1
  %11 = load i32, ptr %"control value 24.4", align 1
  %12 = icmp eq i32 %11, 12
  %13 = zext i1 %12 to i8
  store i8 %13, ptr %"control value 24.5", align 1
  %14 = load i8, ptr %"control value 24.5", align 1
  %15 = icmp eq i8 0, %14
  %16 = zext i1 %15 to i8
  store i8 %16, ptr %"control value 24.6", align 1
  %17 = load i8, ptr %"control value 24.6", align 1
  %18 = icmp ne i8 %17, 0
  br i1 %18, label %if.body1, label %if.else2

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.end6, %if.else
  %19 = load ptr, ptr %heap, align 1
  store ptr %19, ptr %"control value 24.15", align 1
  %20 = load ptr, ptr %"control value 24.15", align 1
  ret ptr %20

if.body1:                                         ; preds = %if.body
  ret ptr null

if.else2:                                         ; preds = %if.body
  br label %if.end3

if.end3:                                          ; preds = %if.else2
  %21 = call i32 @tower.fn.guest_wasm_pages()
  store i32 %21, ptr %"control value 24.7", align 1
  %22 = load i32, ptr %"control value 24.7", align 1
  %23 = call i32 @tower.fn.guest_wasm_limit(i32 %22)
  store i32 %23, ptr %"control value 24.8", align 1
  %24 = load i32, ptr %"control value 24.8", align 1
  %25 = inttoptr i32 %24 to ptr
  store ptr %25, ptr %"control value 24.9", align 1
  %26 = load ptr, ptr %"control value 24.9", align 1
  store ptr %26, ptr %limit, align 1
  %27 = load ptr, ptr %heap, align 1
  store ptr %27, ptr %"control value 24.10", align 1
  %28 = call ptr @guest_wasm_heap_base() #5
  store ptr %28, ptr %"control value 24.11", align 1
  %29 = load ptr, ptr %limit, align 1
  store ptr %29, ptr %"control value 24.12", align 1
  %30 = load ptr, ptr %"control value 24.10", align 1
  %31 = load ptr, ptr %"control value 24.11", align 1
  %32 = load ptr, ptr %"control value 24.12", align 1
  %33 = call zeroext i8 @guest_heap_init(ptr %30, ptr %31, ptr %32) #15
  store i8 %33, ptr %"control value 24.13", align 1
  %34 = load i8, ptr %"control value 24.13", align 1
  %35 = icmp eq i8 0, %34
  %36 = zext i1 %35 to i8
  store i8 %36, ptr %"control value 24.14", align 1
  %37 = load i8, ptr %"control value 24.14", align 1
  %38 = icmp ne i8 %37, 0
  br i1 %38, label %if.body4, label %if.else5

if.body4:                                         ; preds = %if.end3
  ret ptr null

if.else5:                                         ; preds = %if.end3
  br label %if.end6

if.end6:                                          ; preds = %if.else5
  br label %if.end
}

define ptr @malloc(i32 %0) {
entry:
  %bytes = alloca i32, align 4
  %heap = alloca ptr, align 4
  %"control value 25.0" = alloca ptr, align 4
  %"control value 25.1" = alloca ptr, align 4
  %"control value 25.2" = alloca i8, align 1
  %"control value 25.3" = alloca ptr, align 4
  %"control value 25.4" = alloca i32, align 4
  %"control value 25.5" = alloca ptr, align 4
  store i32 %0, ptr %bytes, align 1
  %1 = call ptr @tower.fn.guest_wasm_runtime_heap()
  store ptr %1, ptr %"control value 25.0", align 1
  %2 = load ptr, ptr %"control value 25.0", align 1
  store ptr %2, ptr %heap, align 1
  %3 = load ptr, ptr %heap, align 1
  store ptr %3, ptr %"control value 25.1", align 1
  %4 = load ptr, ptr %"control value 25.1", align 1
  %5 = icmp eq ptr %4, null
  %6 = zext i1 %5 to i8
  store i8 %6, ptr %"control value 25.2", align 1
  %7 = load i8, ptr %"control value 25.2", align 1
  %8 = icmp ne i8 %7, 0
  br i1 %8, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret ptr null

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %9 = load ptr, ptr %heap, align 1
  store ptr %9, ptr %"control value 25.3", align 1
  %10 = load i32, ptr %bytes, align 1
  store i32 %10, ptr %"control value 25.4", align 1
  %11 = load ptr, ptr %"control value 25.3", align 1
  %12 = load i32, ptr %"control value 25.4", align 1
  %13 = call ptr @guest_wasm_allocate(ptr %11, i32 %12, i32 1) #18
  store ptr %13, ptr %"control value 25.5", align 1
  %14 = load ptr, ptr %"control value 25.5", align 1
  ret ptr %14
}

define ptr @realloc(ptr %0, i32 %1) {
entry:
  %pointer = alloca ptr, align 4
  %bytes = alloca i32, align 4
  %heap = alloca ptr, align 4
  %"control value 26.0" = alloca ptr, align 4
  %"control value 26.1" = alloca ptr, align 4
  %"control value 26.2" = alloca i8, align 1
  %"control value 26.3" = alloca ptr, align 4
  %"control value 26.4" = alloca ptr, align 4
  %"control value 26.5" = alloca i32, align 4
  %"control value 26.6" = alloca ptr, align 4
  store ptr %0, ptr %pointer, align 1
  store i32 %1, ptr %bytes, align 1
  %2 = call ptr @tower.fn.guest_wasm_runtime_heap()
  store ptr %2, ptr %"control value 26.0", align 1
  %3 = load ptr, ptr %"control value 26.0", align 1
  store ptr %3, ptr %heap, align 1
  %4 = load ptr, ptr %heap, align 1
  store ptr %4, ptr %"control value 26.1", align 1
  %5 = load ptr, ptr %"control value 26.1", align 1
  %6 = icmp eq ptr %5, null
  %7 = zext i1 %6 to i8
  store i8 %7, ptr %"control value 26.2", align 1
  %8 = load i8, ptr %"control value 26.2", align 1
  %9 = icmp ne i8 %8, 0
  br i1 %9, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret ptr null

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %10 = load ptr, ptr %heap, align 1
  store ptr %10, ptr %"control value 26.3", align 1
  %11 = load ptr, ptr %pointer, align 1
  store ptr %11, ptr %"control value 26.4", align 1
  %12 = load i32, ptr %bytes, align 1
  store i32 %12, ptr %"control value 26.5", align 1
  %13 = load ptr, ptr %"control value 26.3", align 1
  %14 = load ptr, ptr %"control value 26.4", align 1
  %15 = load i32, ptr %"control value 26.5", align 1
  %16 = call ptr @guest_wasm_reallocate(ptr %13, ptr %14, i32 %15, i32 1) #19
  store ptr %16, ptr %"control value 26.6", align 1
  %17 = load ptr, ptr %"control value 26.6", align 1
  ret ptr %17
}

define void @free(ptr %0) {
entry:
  %pointer = alloca ptr, align 4
  %"control value 27.0" = alloca ptr, align 4
  %"control value 27.1" = alloca i8, align 1
  %"control value 27.2" = alloca ptr, align 4
  %"control value 27.3" = alloca ptr, align 4
  store ptr %0, ptr %pointer, align 1
  %1 = load ptr, ptr %pointer, align 1
  store ptr %1, ptr %"control value 27.0", align 1
  %2 = load ptr, ptr %"control value 27.0", align 1
  %3 = icmp eq ptr %2, null
  %4 = zext i1 %3 to i8
  store i8 %4, ptr %"control value 27.1", align 1
  %5 = load i8, ptr %"control value 27.1", align 1
  %6 = icmp ne i8 %5, 0
  br i1 %6, label %if.body, label %if.else

if.body:                                          ; preds = %entry
  ret void

if.else:                                          ; preds = %entry
  br label %if.end

if.end:                                           ; preds = %if.else
  %7 = call ptr @guest_wasm_context() #4
  store ptr %7, ptr %"control value 27.2", align 1
  %8 = load ptr, ptr %pointer, align 1
  store ptr %8, ptr %"control value 27.3", align 1
  %9 = load ptr, ptr %"control value 27.2", align 1
  %10 = load ptr, ptr %"control value 27.3", align 1
  call void @guest_heap_free(ptr %9, ptr %10) #13
  ret void
}

; Function Attrs: nocallback nofree nounwind willreturn memory(argmem: write)
declare void @llvm.memset.p0.i32(ptr nocapture writeonly, i8, i32, i1 immarg) #6

; Function Attrs: nocallback nofree nounwind willreturn memory(argmem: readwrite)
declare void @llvm.memmove.p0.p0.i32(ptr nocapture writeonly, ptr nocapture readonly, i32, i1 immarg) #7

attributes #0 = { "wasm-import-module"="tower" "wasm-import-name"="print" }
attributes #1 = { "wasm-import-module"="tower" "wasm-import-name"="trap" }
attributes #2 = { nocallback nofree nosync nounwind willreturn memory(read) }
attributes #3 = { nocallback nofree nosync nounwind willreturn }
attributes #4 = { "wasm-import-module"="env" "wasm-import-name"="guest_wasm_context" }
attributes #5 = { "wasm-import-module"="env" "wasm-import-name"="guest_wasm_heap_base" }
attributes #6 = { nocallback nofree nounwind willreturn memory(argmem: write) }
attributes #7 = { nocallback nofree nounwind willreturn memory(argmem: readwrite) }
attributes #8 = { "wasm-export-name"="guest_host_allocate" }
attributes #9 = { "wasm-export-name"="guest_host_reallocate" }
attributes #10 = { "wasm-export-name"="guest_host_free" }
attributes #11 = { "wasm-export-name"="guest_runtime_copy" }
attributes #12 = { "wasm-export-name"="guest_heap_allocate" }
attributes #13 = { "wasm-export-name"="guest_heap_free" }
attributes #14 = { nocallback nofree nosync nounwind willreturn memory(read) "wasm-import-module"="env" "wasm-import-name"="llvm.wasm.memory.size.i32" }
attributes #15 = { "wasm-export-name"="guest_heap_init" }
attributes #16 = { nocallback nofree nosync nounwind willreturn "wasm-import-module"="env" "wasm-import-name"="llvm.wasm.memory.grow.i32" }
attributes #17 = { "wasm-export-name"="guest_heap_extend" }
attributes #18 = { "wasm-export-name"="guest_wasm_allocate" }
attributes #19 = { "wasm-export-name"="guest_wasm_reallocate" }
