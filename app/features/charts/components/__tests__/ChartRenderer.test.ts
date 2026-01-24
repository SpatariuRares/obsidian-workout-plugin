import { ChartRenderer } from "../ChartRenderer";
import { Chart } from "chart.js/auto";
import { CHART_DATA_TYPE } from "@app/types";

// Mock DOM createElement
const createMockElement = (id?: string): HTMLElement => {
  const mockCanvas = {
    getContext: jest.fn().mockReturnValue({}),
  } as unknown as HTMLCanvasElement;

  return {
    id: id || "",
    appendChild: jest.fn(),
    classList: {
      add: jest.fn(),
    },
    querySelector: jest.fn().mockReturnValue(mockCanvas),
  } as unknown as HTMLElement;
};

// Mock Chart.js - each instance gets its own destroy function
jest.mock("chart.js/auto", () => {
  return {
    Chart: jest.fn().mockImplementation(() => ({
      destroy: jest.fn(), // Create unique mock for each instance
    })),
  };
});

// Mock ChartContainer
jest.mock("@app/features/charts/components/ChartContainer", () => ({
  ChartContainer: {
    create: jest.fn((parent: HTMLElement) => {
      const container = createMockElement();
      return container;
    }),
    createCanvas: jest.fn(() => {
      return {
        getContext: jest.fn().mockReturnValue({}),
      } as unknown as HTMLCanvasElement;
    }),
  },
}));

// Mock ChartColors and related modules to avoid getComputedStyle dependency
jest.mock("@app/features/charts/config", () => ({
  ChartColors: {
    getChartColors: jest.fn(() => ({
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      gridColor: "rgba(0, 0, 0, 0.1)",
      textColor: "rgb(0, 0, 0)",
      tooltip: {
        background: "rgba(0, 0, 0, 0.8)",
        text: "rgb(255, 255, 255)",
        border: "rgba(0, 0, 0, 1)",
      },
    })),
    getColorSchemeForType: jest.fn(() => ({
      primary: "rgb(100, 150, 200)",
      secondary: "rgba(100, 150, 200, 0.5)",
    })),
  },
  ChartLabels: {
    TREND_LINE: "Trend Line",
  },
  getDefaultChartTitle: jest.fn(() => "Test Chart"),
  ChartConfigBuilder: {
    createChartConfig: jest.fn((labels, datasets, title, colors, chartType) => ({
      type: "line",
      data: { labels, datasets },
      options: {},
    })),
  },
  DatasetStyler: {
    styleDatasets: jest.fn(),
  },
}));

describe("ChartRenderer", () => {
  let mockContainer: HTMLElement;
  const mockParams = {
    exercise: "Bench Press",
    type: CHART_DATA_TYPE.WEIGHT,
    title: "Test Chart",
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock container
    mockContainer = createMockElement("test-chart-container");

    // Reset chart instances by calling destroyAllCharts
    ChartRenderer.destroyAllCharts();
  });

  afterEach(() => {
    // Clean up after each test
    ChartRenderer.destroyAllCharts();
  });

  describe("Chart instance tracking", () => {
    it("should create a new chart instance", () => {
      const labels = ["2024-01-01", "2024-01-02"];
      const datasets = [{ label: "Weight", data: [100, 105] }];

      const result = ChartRenderer.renderChart(
        mockContainer,
        labels,
        datasets,
        mockParams
      );

      expect(result).toBe(true);
      expect(Chart).toHaveBeenCalledTimes(1);
    });

    it("should destroy existing chart before creating new one with same ID", () => {
      const labels = ["2024-01-01", "2024-01-02"];
      const datasets = [{ label: "Weight", data: [100, 105] }];

      // Create first chart
      ChartRenderer.renderChart(mockContainer, labels, datasets, mockParams);

      // Get the mock destroy function from the first chart
      const MockChart = Chart as jest.MockedClass<typeof Chart>;
      const firstChartInstance = MockChart.mock.results[0].value;
      const destroyMock = firstChartInstance.destroy;

      // Create second chart with same container (same ID)
      ChartRenderer.renderChart(mockContainer, labels, datasets, mockParams);

      // Verify destroy was called on the first chart
      expect(destroyMock).toHaveBeenCalledTimes(1);
      expect(Chart).toHaveBeenCalledTimes(2);
    });

    it("should track multiple charts with different IDs", () => {
      const labels = ["2024-01-01", "2024-01-02"];
      const datasets = [{ label: "Weight", data: [100, 105] }];

      // Create first chart
      const container1 = createMockElement("chart-1");
      ChartRenderer.renderChart(container1, labels, datasets, mockParams);

      // Create second chart with different container
      const container2 = createMockElement("chart-2");
      ChartRenderer.renderChart(container2, labels, datasets, mockParams);

      expect(Chart).toHaveBeenCalledTimes(2);
    });
  });

  describe("destroyAllCharts", () => {
    it("should destroy all tracked chart instances", () => {
      const labels = ["2024-01-01", "2024-01-02"];
      const datasets = [{ label: "Weight", data: [100, 105] }];

      // Create multiple charts
      const container1 = createMockElement("chart-1");
      ChartRenderer.renderChart(container1, labels, datasets, mockParams);

      const container2 = createMockElement("chart-2");
      ChartRenderer.renderChart(container2, labels, datasets, mockParams);

      const MockChart = Chart as jest.MockedClass<typeof Chart>;
      const chart1Destroy = MockChart.mock.results[0].value.destroy;
      const chart2Destroy = MockChart.mock.results[1].value.destroy;

      // Call destroyAllCharts
      ChartRenderer.destroyAllCharts();

      // Verify destroy was called on all charts
      expect(chart1Destroy).toHaveBeenCalledTimes(1);
      expect(chart2Destroy).toHaveBeenCalledTimes(1);
    });

    it("should clear chartInstances Map after destroying all charts", () => {
      const labels = ["2024-01-01", "2024-01-02"];
      const datasets = [{ label: "Weight", data: [100, 105] }];

      // Create a chart
      ChartRenderer.renderChart(mockContainer, labels, datasets, mockParams);

      // Destroy all charts
      ChartRenderer.destroyAllCharts();

      // Create another chart - should not call destroy since Map was cleared
      ChartRenderer.renderChart(mockContainer, labels, datasets, mockParams);

      const MockChart = Chart as jest.MockedClass<typeof Chart>;
      const secondChartDestroy = MockChart.mock.results[1].value.destroy;

      // The second chart's destroy should not have been called yet
      expect(secondChartDestroy).not.toHaveBeenCalled();
    });
  });

  describe("Chart ID generation", () => {
    it("should use container ID when available", () => {
      const labels = ["2024-01-01"];
      const datasets = [{ label: "Weight", data: [100] }];

      const container1 = createMockElement("unique-id-123");
      const container2 = createMockElement("unique-id-123"); // Same ID

      // Create first chart
      ChartRenderer.renderChart(container1, labels, datasets, mockParams);

      const MockChart = Chart as jest.MockedClass<typeof Chart>;
      const firstChartDestroy = MockChart.mock.results[0].value.destroy;

      // Create second chart with same container ID - should destroy first
      ChartRenderer.renderChart(container2, labels, datasets, mockParams);

      expect(firstChartDestroy).toHaveBeenCalledTimes(1);
    });

    it("should generate hash-based ID when container has no ID", () => {
      const labels = ["2024-01-01"];
      const datasets = [{ label: "Weight", data: [100] }];

      const containerNoId = createMockElement(); // No ID
      const result = ChartRenderer.renderChart(
        containerNoId,
        labels,
        datasets,
        mockParams
      );

      expect(result).toBe(true);
      expect(Chart).toHaveBeenCalledTimes(1);
    });
  });
});
