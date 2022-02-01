package io.openex.importer;

import com.fasterxml.jackson.databind.JsonNode;
import io.openex.service.ImportEntry;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Spliterator;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

import static java.util.Spliterators.spliteratorUnknownSize;

public interface Importer {

    void importData(JsonNode importNode, Map<String, ImportEntry> docReferences);

    default Stream<JsonNode> resolveJsonElements(JsonNode node, String key) {
        JsonNode dataNode = node.get(key);
        if (dataNode == null) {
            return Stream.empty();
        }
        Iterator<JsonNode> elements = dataNode.elements();
        Spliterator<JsonNode> elementsSplit = spliteratorUnknownSize(elements, Spliterator.ORDERED);
        return StreamSupport.stream(elementsSplit, false);
    }

    default List<String> resolveJsonIds(JsonNode node, String key) {
        return resolveJsonElements(node, key).map(JsonNode::asText).toList();
    }
}
