import SwiftUI
import Observation
import SwiftData
import UIKit
import CoreText

@main struct MyApp: App {
    init() {
        AppFontRegistrar.registerFonts()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: PushDayRecord.self)
    }
}

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        PushHomeView(modelContext: modelContext)
    }
}

@Model
final class PushDayRecord {
    @Attribute(.unique) var dayStart: Date
    var reps: Int
    var colorIndex: Int

    init(dayStart: Date, reps: Int = 0, colorIndex: Int) {
        self.dayStart = dayStart
        self.reps = reps
        self.colorIndex = colorIndex
    }
}

@MainActor
@Observable
final class PushHomeViewModel {
    var history: [PushDay] = []
    var lifetimePushUps = 0
    var currentStreak = 0
    var longestStreak = 0
    var highlightedRepID: UUID?
    var activeAddAmount: Int?
    var addPulseID = UUID()

    private let calendar = Calendar.current
    private let haptics = PushHaptics()
    private let modelContext: ModelContext
    private let usesDummyHistory = true
    private var todayRecord: PushDayRecord?

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        loadHistory()
    }

    var visibleWeek: [PushDay] {
        Array(history.suffix(7))
    }

    func loadHistory() {
        if usesDummyHistory {
            todayRecord = nil
            history = makeDummyHistory()
            lifetimePushUps = history.map(\.reps).reduce(0, +)
            currentStreak = Self.currentStreak(in: history)
            longestStreak = Self.longestStreak(in: history)
            return
        }

        let records = fetchOrCreateRecentRecords()
        let sortedRecords = records.sorted { $0.dayStart < $1.dayStart }

        todayRecord = sortedRecords.last
        history = sortedRecords.map(makePushDay)
        lifetimePushUps = sortedRecords.map(\.reps).reduce(0, +)
        currentStreak = Self.currentStreak(in: sortedRecords)
        longestStreak = Self.longestStreak(in: sortedRecords)
    }

    var todayReps: Int {
        history.last?.reps ?? 0
    }

    var yesterdayReps: Int {
        history.dropLast().last?.reps ?? 0
    }

    var bestDay: Int {
        history.map(\.reps).max() ?? 0
    }

    var dailyAverage: Int {
        guard !history.isEmpty else { return 0 }
        let total = history.map(\.reps).reduce(0, +)
        return Int((Double(total) / Double(history.count)).rounded())
    }

    var activeDaysPercentage: Int {
        guard !history.isEmpty else { return 0 }
        let activeDays = history.filter { $0.reps > 0 }.count
        return Int((Double(activeDays) / Double(history.count) * 100).rounded())
    }

    var motivationText: String {
        if todayReps == 0 {
            return "1 push-up keeps your streak alive"
        }

        if todayReps <= yesterdayReps {
            return "\(yesterdayReps - todayReps + 1) more to beat yesterday"
        }

        if todayReps < bestDay {
            return "\(bestDay - todayReps + 1) more for a new daily best"
        }

        return "New daily best. Keep pushing."
    }

    func prewarmHaptics() {
        haptics.prewarm()
    }

    func addPushUps(_ amount: Int) {
        guard amount > 0 else { return }
        Task {
            await addPushUpsSequentially(min(amount, 250))
        }
    }

    private func addPushUpsSequentially(_ amount: Int) async {
        activeAddAmount = amount
        addPulseID = UUID()
        haptics.start(amount: amount)

        for index in 0..<amount {
            let rep = PushRep(color: PushPalette.todaySquare)
            withAnimation(.spring(response: 0.2, dampingFraction: 0.7)) {
                appendPushUps([rep])
                highlightedRepID = rep.id
            }

            haptics.repAdded(index: index, total: amount)

            let delay = haptics.repCadenceNanoseconds(for: amount)
            if delay > 0, index < amount - 1 {
                try? await Task.sleep(nanoseconds: delay)
            }
        }

        if usesDummyHistory == false {
            saveChanges()
        }
        haptics.finish(amount: amount)
        await clearAddFeedback()
    }

    private func appendPushUps(_ reps: [PushRep]) {
        guard history.isEmpty == false else { return }

        history[history.count - 1].reps += reps.count
        history[history.count - 1].repsIDs.append(contentsOf: reps)
        lifetimePushUps += reps.count
        todayRecord?.reps += reps.count
        refreshStats()
    }

    private func clearAddFeedback() async {
        try? await Task.sleep(nanoseconds: 320_000_000)
        withAnimation(.easeOut(duration: 0.22)) {
            highlightedRepID = nil
            activeAddAmount = nil
        }
    }

    private func fetchOrCreateRecentRecords() -> [PushDayRecord] {
        let today = calendar.startOfDay(for: .now)
        let descriptor = FetchDescriptor<PushDayRecord>(sortBy: [SortDescriptor(\.dayStart)])
        var records = (try? modelContext.fetch(descriptor)) ?? []
        removeLeadingEmptyRecords(from: &records)

        guard let firstRecordedDay = records.first?.dayStart else {
            let record = PushDayRecord(dayStart: today, colorIndex: 0)
            modelContext.insert(record)
            saveChanges()
            return [record]
        }

        let existingDays = Set(records.map(\.dayStart))
        let dayCount = calendar.dateComponents([.day], from: firstRecordedDay, to: today).day ?? 0

        if dayCount >= 0 {
            for offset in 0...dayCount {
                guard let dayStart = calendar.date(byAdding: .day, value: offset, to: firstRecordedDay) else { continue }
                guard existingDays.contains(dayStart) == false else { continue }

                let record = PushDayRecord(
                    dayStart: dayStart,
                    colorIndex: offset % PushPalette.weekColors.count
                )
                modelContext.insert(record)
                records.append(record)
            }
        }

        saveChanges()
        return records
    }

    private func removeLeadingEmptyRecords(from records: inout [PushDayRecord]) {
        guard let firstActiveIndex = records.firstIndex(where: { $0.reps > 0 }) else {
            if records.count > 1 {
                records.dropLast().forEach(modelContext.delete)
                records = records.suffix(1)
            }
            return
        }

        guard firstActiveIndex > 0 else { return }

        for record in records.prefix(firstActiveIndex) {
            modelContext.delete(record)
        }
        records.removeFirst(firstActiveIndex)
    }

    private func makeDummyHistory() -> [PushDay] {
        let today = calendar.startOfDay(for: .now)
        let dummyReps = [27, 48, 39, 72, 54, 66, 0]

        return dummyReps.enumerated().compactMap { index, reps in
            let dayOffset = index - (dummyReps.count - 1)
            guard let date = calendar.date(byAdding: .day, value: dayOffset, to: today) else { return nil }
            let color = PushPalette.weekColors[index % PushPalette.weekColors.count]

            return PushDay(
                date: date,
                weekday: PushDay.weekday(for: date, calendar: calendar),
                reps: reps,
                color: color,
                isToday: dayOffset == 0
            )
        }
    }

    private func makePushDay(from record: PushDayRecord) -> PushDay {
        let today = calendar.startOfDay(for: .now)
        let color = PushPalette.weekColors[record.colorIndex % PushPalette.weekColors.count]

        return PushDay(
            date: record.dayStart,
            weekday: PushDay.weekday(for: record.dayStart, calendar: calendar),
            reps: record.reps,
            color: color,
            isToday: calendar.isDate(record.dayStart, inSameDayAs: today)
        )
    }

    private func refreshStats() {
        currentStreak = Self.currentStreak(in: history)
        longestStreak = max(longestStreak, Self.longestStreak(in: history))
    }

    private func saveChanges() {
        guard modelContext.hasChanges else { return }
        try? modelContext.save()
    }

    private static func currentStreak(in records: [PushDayRecord]) -> Int {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: .now)
        let repsByDay = Dictionary(uniqueKeysWithValues: records.map { ($0.dayStart, $0.reps) })
        var day = today

        if (repsByDay[today] ?? 0) == 0 {
            guard let previousDay = calendar.date(byAdding: .day, value: -1, to: today) else { return 0 }
            day = previousDay
        }

        var streak = 0
        while (repsByDay[day] ?? 0) > 0 {
            streak += 1
            guard let previousDay = calendar.date(byAdding: .day, value: -1, to: day) else { break }
            day = previousDay
        }

        return streak
    }

    private static func longestStreak(in records: [PushDayRecord]) -> Int {
        let sortedRecords = records.sorted { $0.dayStart < $1.dayStart }
        var best = 0
        var current = 0

        for record in sortedRecords {
            if record.reps > 0 {
                current += 1
                best = max(best, current)
            } else {
                current = 0
            }
        }

        return best
    }

    private static func currentStreak(in days: [PushDay]) -> Int {
        let streakDays = days.last?.reps == 0 ? days.dropLast() : days[...]
        var streak = 0

        for day in streakDays.reversed() {
            guard day.reps > 0 else { break }
            streak += 1
        }

        return streak
    }

    private static func longestStreak(in days: [PushDay]) -> Int {
        var best = 0
        var current = 0

        for day in days {
            if day.reps > 0 {
                current += 1
                best = max(best, current)
            } else {
                current = 0
            }
        }

        return best
    }
}

struct PushDay: Identifiable {
    let id: Date
    let weekday: String
    var reps: Int
    let color: Color
    let isToday: Bool
    var repsIDs: [PushRep]

    init(date: Date, weekday: String, reps: Int, color: Color, isToday: Bool) {
        self.id = date
        self.weekday = weekday
        self.reps = reps
        self.color = color
        self.isToday = isToday
        self.repsIDs = (0..<reps).map { _ in PushRep(color: isToday ? PushPalette.todaySquare : color) }
    }

    static func weekday(for date: Date, calendar: Calendar) -> String {
        let index = calendar.component(.weekday, from: date) - 1
        return String(calendar.shortWeekdaySymbols[index].prefix(1)).uppercased()
    }
}

struct PushRep: Identifiable, Equatable {
    let id = UUID()
    let color: Color
}

struct PushHomeView: View {
    @State private var viewModel: PushHomeViewModel

    init(modelContext: ModelContext) {
        _viewModel = State(initialValue: PushHomeViewModel(modelContext: modelContext))
    }

    var body: some View {
        ZStack {
            PushPalette.background
                .ignoresSafeArea()

            backgroundGlow

            GeometryReader { geometry in
                VStack(spacing: 0) {
                    VStack(alignment: .leading, spacing: 10) {
                        header
                        totalBlock
                        PushHistoryGraph(
                            days: viewModel.visibleWeek,
                            highlightedRepID: viewModel.highlightedRepID,
                            activeAddAmount: viewModel.activeAddAmount,
                            addPulseID: viewModel.addPulseID
                        )
                        .frame(height: geometry.size.height * 0.34)
                        StatsStrip(viewModel: viewModel)
                        Spacer(minLength: 8)
                        quickAddControls
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, 4)
                    .padding(.bottom, 12)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)

                    PushTabBar()
                }
            }
            .ignoresSafeArea(.container, edges: .bottom)
        }
        .preferredColorScheme(.dark)
        .task {
            viewModel.prewarmHaptics()
        }
    }

    private var backgroundGlow: some View {
        ZStack {
            RadialGradient(
                colors: [PushPalette.pink.opacity(0.22), .clear],
                center: .topTrailing,
                startRadius: 20,
                endRadius: 330
            )
            .ignoresSafeArea()

            RadialGradient(
                colors: [PushPalette.orange.opacity(0.12), .clear],
                center: .bottomLeading,
                startRadius: 10,
                endRadius: 300
            )
            .ignoresSafeArea()
        }
    }

    private var header: some View {
        HStack(alignment: .center) {
            Text("PUSH")
                .font(.custom("Orbitron-Black", size: 39))
                .tracking(1)
                .foregroundStyle(.white)
                .shadow(color: .white.opacity(0.18), radius: 12)

            Spacer()

            StreakView(streak: viewModel.currentStreak)
        }
    }

    private var totalBlock: some View {
        VStack(spacing: 4) {
            Text("PUSH-UPS TODAY")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.62))
                .tracking(0.5)

            Text("\(viewModel.todayReps)")
                .font(.system(size: 76, weight: .bold, design: .default))
                .monospacedDigit()
                .contentTransition(.numericText(value: Double(viewModel.todayReps)))
                .foregroundStyle(.white)
                .shadow(color: .white.opacity(0.22), radius: 14)
                .minimumScaleFactor(0.7)
                .animation(.spring(response: 0.28, dampingFraction: 0.72), value: viewModel.todayReps)

            HStack(spacing: 6) {
                Image(systemName: "flame.fill")
                    .foregroundStyle(PushPalette.orange)
                Text(viewModel.motivationText)
                    .foregroundStyle(.white.opacity(0.9))
            }
            .font(.system(size: 17, weight: .semibold, design: .rounded))
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 2)
    }

    private var quickAddControls: some View {
        VStack(spacing: 9) {
            HStack(alignment: .bottom, spacing: 6) {
                QuickAddButton(amount: 1, colors: [PushPalette.yellow, PushPalette.bronze], dotCount: 1, sizeLevel: .small) {
                    viewModel.addPushUps(1)
                }

                QuickAddButton(amount: 5, colors: [PushPalette.orange, PushPalette.deepOrange], dotCount: 2, sizeLevel: .medium) {
                    viewModel.addPushUps(5)
                }

                QuickAddButton(amount: 10, colors: [PushPalette.coral, PushPalette.pink], dotCount: 5, sizeLevel: .large) {
                    viewModel.addPushUps(10)
                }

                QuickAddButton(amount: 25, colors: [PushPalette.magenta, PushPalette.purple], dotCount: 10, sizeLevel: .hero) {
                    viewModel.addPushUps(25)
                }
            }

            CustomAmountButton { amount in
                viewModel.addPushUps(amount)
            }
        }
    }
}

struct PushHistoryGraph: View {
    let days: [PushDay]
    let highlightedRepID: UUID?
    let activeAddAmount: Int?
    let addPulseID: UUID

    var body: some View {
        GeometryReader { geometry in
            let axisValues = axisValues(for: days)
            let gridScale = axisValues.first ?? 100
            let towerScale = max(90, days.map(\.reps).max() ?? 0)
            let chartHeight = geometry.size.height - 34
            let maxRows = Int(ceil(Double(towerScale) / 3.0))
            let squareGap: CGFloat = 0.7
            let squareSize = min(13.9, (chartHeight - CGFloat(maxRows - 1) * squareGap) / CGFloat(maxRows))
            let towerWidth = max(28, squareSize * 3 + squareGap * 2)
            let stackHeight = CGFloat(maxRows) * squareSize + CGFloat(maxRows - 1) * squareGap

            ZStack(alignment: .topLeading) {
                grid(height: chartHeight, maxScale: gridScale)

                HStack(alignment: .bottom, spacing: 0) {
                    Color.clear.frame(width: 34)
                    ForEach(Array(days.enumerated()), id: \.element.id) { index, day in
                        if index > 0 {
                            Spacer(minLength: 8)
                        }

                        PushDayColumn(
                            day: day,
                            squareSize: squareSize,
                            stackHeight: stackHeight,
                            highlightedRepID: highlightedRepID,
                            activeAddAmount: activeAddAmount,
                            addPulseID: addPulseID
                        )
                        .frame(width: towerWidth)
                    }
                }
                .frame(height: geometry.size.height, alignment: .bottomLeading)
            }
        }
    }

    private func grid(height: CGFloat, maxScale: Int) -> some View {
        let axisValues = axisValues(for: days)

        return ZStack(alignment: .topLeading) {
            ForEach(axisValues, id: \.self) { value in
                let y = height - CGFloat(value) / CGFloat(maxScale) * height
                HStack(spacing: 9) {
                    Text("\(value)")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(value == 0 ? 0.45 : 0.38))
                        .frame(width: 27, alignment: .trailing)

                    Rectangle()
                        .fill(.white.opacity(value == 0 ? 0.08 : 0.035))
                        .frame(height: value == 0 ? 1.2 : 1)
                }
                .offset(y: y - 8)
            }
        }
        .frame(height: height, alignment: .topLeading)
    }

    private func axisValues(for days: [PushDay]) -> [Int] {
        let visibleMax = max(days.map(\.reps).max() ?? 0, 1)
        let rawStep = Double(visibleMax) / 4.0
        let step = max(10, Int(ceil(rawStep / 5.0)) * 5)
        let axisMax = step * 4
        return stride(from: axisMax, through: 0, by: -step).map { $0 }
    }
}

struct PushDayColumn: View {
    let day: PushDay
    let squareSize: CGFloat
    let stackHeight: CGFloat
    let highlightedRepID: UUID?
    let activeAddAmount: Int?
    let addPulseID: UUID

    var body: some View {
        VStack(spacing: 8) {
            ZStack(alignment: .bottom) {
                if day.isToday, let amount = activeAddAmount {
                    AddColumnGlow(amount: amount)
                        .id(addPulseID)
                        .frame(width: max(74, squareSize * 5.2), height: stackHeight)
                        .transition(.opacity)
                }

                VStack(spacing: 0.7) {
                    ForEach(Array(repRows.reversed().enumerated()), id: \.offset) { _, row in
                        HStack(spacing: 0.7) {
                            ForEach(0..<3, id: \.self) { column in
                                if let rep = row[column] {
                                    repSquare(rep)
                                } else {
                                    Color.clear
                                        .frame(width: squareSize, height: squareSize)
                                }
                            }
                        }
                    }
                }
                .frame(height: stackHeight, alignment: .bottom)

                if day.isToday {
                    todayBadge
                        .offset(y: -CGFloat(Int(ceil(Double(day.reps) / 3.0))) * (squareSize + 0.7) - 13)
                }
            }
            .frame(height: stackHeight, alignment: .bottom)

            Text(day.weekday)
                .font(.system(size: 13, weight: .black, design: .rounded))
                .foregroundStyle(day.isToday ? .black : .white.opacity(0.52))
                .frame(width: 28, height: 28)
                .background {
                    if day.isToday {
                        Circle().fill(.white)
                    }
                }
        }
        .frame(maxHeight: .infinity, alignment: .bottom)
        .opacity(day.reps == 0 ? 0.38 : 1)
    }

    private var todayBadge: some View {
        Text("\(day.reps)")
            .font(.system(size: 13, weight: .black, design: .rounded))
            .monospacedDigit()
            .foregroundStyle(.black)
            .lineLimit(1)
            .minimumScaleFactor(0.72)
            .frame(minWidth: 38, minHeight: 26)
            .padding(.horizontal, day.reps >= 100 ? 8 : 0)
            .background(.white, in: Capsule())
            .shadow(color: .white.opacity(0.26), radius: 8)
            .contentTransition(.numericText(value: Double(day.reps)))
    }

    private var repRows: [[PushRep?]] {
        let fillOrder = [1, 0, 2]
        return day.repsIDs.enumerated().reduce(into: [[PushRep?]]()) { rows, item in
            let rowIndex = item.offset / 3
            let positionInRow = item.offset % 3

            if rows.indices.contains(rowIndex) == false {
                rows.append([nil, nil, nil])
            }

            rows[rowIndex][fillOrder[positionInRow]] = item.element
        }
    }

    private func repSquare(_ rep: PushRep) -> some View {
        let isHighlighted = highlightedRepID == rep.id

        return RoundedRectangle(cornerRadius: 1.8, style: .continuous)
            .fill(fill(for: rep))
            .frame(width: squareSize, height: squareSize)
            .overlay {
                if day.isToday {
                    RoundedRectangle(cornerRadius: 1.8, style: .continuous)
                        .stroke(.white.opacity(isHighlighted ? 0.95 : 0.72), lineWidth: isHighlighted ? 0.8 : 0.45)
                }
            }
            .shadow(color: glowColor(isHighlighted: isHighlighted, rep: rep), radius: isHighlighted ? 4 : 0, x: 0, y: 0)
            .scaleEffect(isHighlighted ? 1.9 : 1)
            .animation(.spring(response: 0.2, dampingFraction: 0.56), value: isHighlighted)
            .transition(.asymmetric(
                insertion: .scale(scale: 0.2).combined(with: .opacity),
                removal: .opacity
            ))
    }

    private func fill(for rep: PushRep) -> some ShapeStyle {
        if day.isToday {
            return AnyShapeStyle(Color.clear)
        }

        return AnyShapeStyle(
            LinearGradient(
                colors: [rep.color, rep.color.opacity(0.68)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
    }

    private func glowColor(isHighlighted: Bool, rep: PushRep) -> Color {
        guard isHighlighted else { return .clear }
        return day.isToday ? .white.opacity(0.2) : rep.color.opacity(0.22)
    }
}

struct AddColumnGlow: View {
    let amount: Int
    @State private var isGlowing = false

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [glowColor.opacity(0.05), glowColor.opacity(0.34), glowColor.opacity(0.05)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .blur(radius: 16)

            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(glowColor.opacity(0.22))
                .blur(radius: 28)
                .scaleEffect(x: isGlowing ? 1.22 : 0.74, y: isGlowing ? 1.05 : 0.88)
        }
        .opacity(isGlowing ? glowOpacity : 0)
        .scaleEffect(x: isGlowing ? 1 : 0.82, y: 1)
        .animation(.easeOut(duration: amount >= 25 ? 0.56 : 0.34), value: isGlowing)
        .onAppear {
            isGlowing = true
        }
    }

    private var glowOpacity: Double {
        switch amount {
        case 25...:
            0.9
        case 10...:
            0.78
        case 5...:
            0.66
        default:
            0.52
        }
    }

    private var glowColor: Color {
        switch amount {
        case 25...:
            PushPalette.magenta
        case 10...:
            PushPalette.pink
        case 5...:
            PushPalette.orange
        default:
            PushPalette.yellow
        }
    }
}

struct StatsStrip: View {
    let viewModel: PushHomeViewModel

    var body: some View {
        HStack(spacing: 0) {
            StatItem(icon: "figure.strengthtraining.traditional", value: viewModel.lifetimePushUps.formatted(), label: "LIFETIME")
            StatItem(icon: "star.fill", value: "\(viewModel.bestDay)", label: "BEST DAY")
            StatItem(icon: "chart.line.uptrend.xyaxis", value: "\(viewModel.dailyAverage)", label: "DAILY AVG")
            StatItem(icon: "target", value: "\(viewModel.activeDaysPercentage)%", label: "ACTIVE DAYS")
        }
        .padding(.vertical, 10)
        .background(
            LinearGradient(
                colors: [.white.opacity(0.07), .white.opacity(0.035)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 8, style: .continuous)
        )
    }
}

struct StatItem: View {
    let icon: String
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(PushPalette.purple.opacity(0.95))

            Text(value)
                .font(.system(size: 20, weight: .semibold))
                .monospacedDigit()
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.62)

            Text(label)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.white.opacity(0.48))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .overlay(alignment: .trailing) {
            Rectangle()
                .fill(.white.opacity(label == "ACTIVE DAYS" ? 0 : 0.09))
                .frame(width: 1, height: 48)
        }
    }
}

struct QuickAddButton: View {
    enum SizeLevel {
        case small
        case medium
        case large
        case hero

        var width: CGFloat {
            switch self {
            case .small: 54
            case .medium: 66
            case .large: 86
            case .hero: 125
            }
        }

        var height: CGFloat {
            68
        }

        var fontSize: CGFloat {
            switch self {
            case .small: 26
            case .medium: 28
            case .large: 30
            case .hero: 32
            }
        }
    }

    let amount: Int
    let colors: [Color]
    let dotCount: Int
    let sizeLevel: SizeLevel
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button {
            action()
        } label: {
            VStack(spacing: sizeLevel == .hero ? 2 : 6) {
                Text("+\(amount)")
                    .font(.system(size: sizeLevel.fontSize, weight: .black, design: .rounded))
                    .foregroundStyle(buttonTextColor)

                DotRow(count: dotCount, color: colors.first ?? .white)
            }
            .frame(width: sizeLevel.width, height: sizeLevel.height)
            .background {
                ZStack {
                    LinearGradient(colors: colors.map { $0.opacity(0.38) }, startPoint: .topLeading, endPoint: .bottomTrailing)
                    RadialGradient(colors: [(colors.last ?? .white).opacity(0.32), .clear], center: .bottomTrailing, startRadius: 5, endRadius: 90)
                }
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke((colors.first ?? .white).opacity(0.18), lineWidth: 1)
            )
            .shadow(color: (colors.last ?? .white).opacity(0.22), radius: amount >= 10 ? 18 : 10, y: 7)
            .scaleEffect(isPressed ? 0.94 : 1)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    withAnimation(.spring(response: 0.18, dampingFraction: 0.62)) {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    withAnimation(.spring(response: 0.22, dampingFraction: 0.56)) {
                        isPressed = false
                    }
                }
        )
    }

    private var buttonTextColor: Color {
        colors.first ?? .white
    }
}

struct DotRow: View {
    let count: Int
    let color: Color

    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<count, id: \.self) { _ in
                Circle()
                    .fill(color)
                    .frame(width: 5, height: 5)
            }
        }
    }

}

struct StreakView: View {
    let streak: Int

    var body: some View {
        VStack(alignment: .trailing, spacing: 3) {
            HStack(spacing: 5) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(PushPalette.orange)
                Text("\(streak)")
                    .font(.system(size: 23, weight: .black, design: .rounded))
                    .foregroundStyle(PushPalette.coral)
            }

            Text("DAY STREAK")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
        }
    }
}

struct PushTabBar: View {
    var body: some View {
        HStack(spacing: 0) {
            TabBarItem(icon: "house.fill", title: "Home", isSelected: true)
            TabBarItem(icon: "chart.bar.fill", title: "Progress", isSelected: false)
            TabBarItem(icon: "gearshape.fill", title: "Settings", isSelected: false)
        }
        .padding(.horizontal, 24)
        .padding(.top, 7)
        .padding(.bottom, 28)
        .background(
            Rectangle()
                .fill(.black.opacity(0.36))
                .overlay(alignment: .top) {
                    Rectangle()
                        .fill(.white.opacity(0.07))
                        .frame(height: 1)
                }
        )
    }
}

struct TabBarItem: View {
    let icon: String
    let title: String
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 19, weight: .semibold))
            Text(title)
                .font(.system(size: 10, weight: .semibold, design: .rounded))
        }
        .foregroundStyle(isSelected ? PushPalette.pink : .white.opacity(0.42))
        .frame(maxWidth: .infinity)
        .overlay(alignment: .top) {
            if isSelected {
                Capsule()
                    .fill(PushPalette.pink)
                    .frame(width: 24, height: 3)
                    .offset(y: -10)
                    .shadow(color: PushPalette.pink.opacity(0.55), radius: 8)
            }
        }
    }
}

struct CustomAmountButton: View {
    @State private var showingCustomAmount = false

    let onAdd: (Int) -> Void

    var body: some View {
        Button {
            showingCustomAmount = true
        } label: {
            HStack(spacing: 7) {
                Spacer()
                Text("Custom Amount")
                Image(systemName: "pencil")
                    .font(.system(size: 13, weight: .bold))
                Spacer()
            }
            .font(.system(size: 16, weight: .semibold, design: .rounded))
            .foregroundStyle(.white.opacity(0.86))
            .padding(.vertical, 12)
            .background(.white.opacity(0.055), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showingCustomAmount) {
            CustomAmountSheet(onAdd: onAdd)
                .presentationDetents([.height(250)])
                .presentationDragIndicator(.visible)
        }
    }
}

struct CustomAmountSheet: View {
    @Environment(\.dismiss) private var dismiss
    @FocusState private var isAmountFieldFocused: Bool
    @State private var amountText = ""

    let onAdd: (Int) -> Void

    private var amount: Int {
        Int(amountText) ?? 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Custom Amount")
                .font(.system(size: 25, weight: .black, design: .rounded))

            TextField("Push-ups", text: $amountText)
                .keyboardType(.numberPad)
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                .focused($isAmountFieldFocused)
                .onChange(of: amountText) { _, newValue in
                    let filtered = newValue.filter(\.isNumber)
                    if filtered != newValue {
                        amountText = filtered
                    }
                }

            Button {
                guard amount > 0 else { return }

                onAdd(amount)
                dismiss()
            } label: {
                Text("Add Push-ups")
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .foregroundStyle(.black.opacity(0.84))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(
                        LinearGradient(colors: [PushPalette.coral, PushPalette.magenta], startPoint: .leading, endPoint: .trailing),
                        in: RoundedRectangle(cornerRadius: 8, style: .continuous)
                    )
            }
            .buttonStyle(.plain)
            .disabled(amount <= 0)
            .opacity(amount <= 0 ? 0.45 : 1)
        }
        .padding(22)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(PushPalette.surface)
        .preferredColorScheme(.dark)
        .task {
            try? await Task.sleep(nanoseconds: 250_000_000)
            isAmountFieldFocused = true
        }
    }
}

enum AppFontRegistrar {
    static func registerFonts() {
        guard let fontURL = Bundle.main.url(forResource: "Orbitron-Black", withExtension: "ttf") else {
            return
        }

        CTFontManagerRegisterFontsForURL(fontURL as CFURL, .process, nil)
    }
}

final class PushHaptics {
    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let rigidImpact = UIImpactFeedbackGenerator(style: .rigid)

    func prewarm() {
        lightImpact.prepare()
        mediumImpact.prepare()
        rigidImpact.prepare()
    }

    func start(amount: Int) {
        prewarm()
    }

    func repAdded(index: Int, total: Int) {
        let progress = total <= 1 ? 1 : Double(index) / Double(total - 1)
        let intensity = 0.42 + progress * 0.28

        lightImpact.impactOccurred(intensity: intensity)
        lightImpact.prepare()

        if total >= 10, (index + 1).isMultiple(of: 5), index < total - 1 {
            mediumImpact.impactOccurred(intensity: 0.34 + progress * 0.18)
            mediumImpact.prepare()
        }
    }

    func finish(amount: Int) {
        switch amount {
        case 25...:
            rigidImpact.impactOccurred(intensity: 0.95)
        case 10...:
            mediumImpact.impactOccurred(intensity: 0.82)
        case 5...:
            mediumImpact.impactOccurred(intensity: 0.58)
        default:
            break
        }
    }

    func repCadenceNanoseconds(for amount: Int) -> UInt64 {
        switch amount {
        case 25...:
            58_000_000
        case 10...:
            72_000_000
        case 5...:
            92_000_000
        default:
            0
        }
    }
}

enum PushPalette {
    static let background = Color(red: 0.015, green: 0.017, blue: 0.023)
    static let surface = Color(red: 0.052, green: 0.055, blue: 0.066)
    static let yellow = Color(red: 1.0, green: 0.82, blue: 0.18)
    static let bronze = Color(red: 0.64, green: 0.42, blue: 0.08)
    static let orange = Color(red: 1.0, green: 0.52, blue: 0.19)
    static let deepOrange = Color(red: 0.64, green: 0.26, blue: 0.06)
    static let coral = Color(red: 1.0, green: 0.31, blue: 0.34)
    static let pink = Color(red: 1.0, green: 0.18, blue: 0.48)
    static let magenta = Color(red: 0.93, green: 0.24, blue: 0.95)
    static let purple = Color(red: 0.50, green: 0.12, blue: 0.72)
    static let todaySquare = Color.white

    static let weekColors = [yellow, orange, coral, pink, magenta, purple]
}

#Preview {
    ContentView()
        .modelContainer(for: PushDayRecord.self, inMemory: true)
}
